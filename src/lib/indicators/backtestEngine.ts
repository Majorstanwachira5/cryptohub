import {
  AssetClass,
  BacktestSummary,
  BacktestTrade,
  Candle,
  TradeDirection,
} from "@/types";
import { generateCandleHistory, hashSeed } from "@/lib/market/assets";
import { calculateATR } from "./technical";
import { buildSignals, computeConfluence } from "./signals";

/** Timeframe label to bar duration in seconds. */
export const TIMEFRAME_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1H": 3600,
  "4H": 14400,
  "1D": 86400,
};

/**
 * Rolls a fine series up into a coarser timeframe by grouping bars and
 * rebuilding OHLC from the constituents. Used so multi-timeframe confirmation
 * and the replay share one price source.
 */
export function aggregateCandles(candles: Candle[], factor: number): Candle[] {
  if (factor <= 1) return candles;
  const out: Candle[] = [];

  for (let i = 0; i < candles.length; i += factor) {
    const group = candles.slice(i, i + factor);
    if (group.length === 0) continue;
    out.push({
      time: group[group.length - 1].time,
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((a, c) => a + c.volume, 0),
    });
  }

  return out;
}

export interface BacktestConfig {
  symbol: string;
  assetClass: AssetClass;
  digits: number;
  /** Base per-bar volatility used to synthesise the replay series. */
  volatility: number;
  /** Minimum absolute confluence score to open a position. */
  signalThreshold: number;
  /** Stop distance as a multiple of ATR. */
  atrStopMultiple: number;
  /** Reward distance as a multiple of ATR. */
  atrTargetMultiple: number;
  /** Bars a position may be held before a time exit. */
  maxBarsInTrade: number;
  /** Bars required before the first trade is eligible. */
  warmupBars: number;
  /** Candles fed to the indicator stack at each evaluation. */
  lookbackBars: number;
  /** Round-turn cost in basis points of notional (spread + commission). */
  costBps: number;
}

export const DEFAULT_BACKTEST_CONFIG: Omit<
  BacktestConfig,
  "symbol" | "assetClass" | "digits" | "volatility"
> = {
  signalThreshold: 25,
  atrStopMultiple: 1.5,
  atrTargetMultiple: 3,
  maxBarsInTrade: 24,
  warmupBars: 120,
  lookbackBars: 260,
  costBps: 8,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Builds the deterministic price series the replay runs against.
 *
 * A fixed per-symbol seed means the replay is reproducible: the same symbol
 * always yields the same sample, so published statistics stay comparable
 * between runs instead of drifting on every request.
 */
function buildReplaySeries(config: BacktestConfig, bars: number, seedSuffix: string): Candle[] {
  return generateCandleHistory(
    1000,
    config.volatility,
    bars,
    TIMEFRAME_SECONDS["1H"],
    hashSeed(`${config.symbol}:${seedSuffix}:${config.volatility}`)
  );
}

interface ReplayResult {
  trades: BacktestTrade[];
  equityCurve: number[];
}

function replayTimeframe(config: BacktestConfig, candles: Candle[]): ReplayResult {
  const trades: BacktestTrade[] = [];
  const equityCurve: number[] = [0];
  const bars = candles.length;
  const costPercent = config.costBps / 100;
  const riskDistance = config.atrTargetMultiple / config.atrStopMultiple;

  let i = config.warmupBars;

  while (i < bars - 2) {
    const window = candles.slice(
      Math.max(0, i - config.lookbackBars),
      i + 1
    );

    if (window.length < 60) break;

    const { score } = computeConfluence(buildSignals(window, config.digits));

    if (Math.abs(score) < config.signalThreshold) {
      i += 1;
      continue;
    }

    const direction: TradeDirection = score > 0 ? "LONG" : "SHORT";
    const atr = calculateATR(window, 14);
    if (!atr || atr <= 0) {
      i += 1;
      continue;
    }

    // Enter on the NEXT bar's open. Using the signal bar's own close would let
    // the backtest trade on information it could not have had.
    const entryBar = candles[i + 1];
    const entryPrice = entryBar.open;
    const stopDistance = atr * config.atrStopMultiple;
    const targetDistance = atr * config.atrTargetMultiple;

    const stopLoss =
      direction === "LONG" ? entryPrice - stopDistance : entryPrice + stopDistance;
    const takeProfit =
      direction === "LONG" ? entryPrice + targetDistance : entryPrice - targetDistance;

    let exitPrice = entryPrice;
    let exitReason: BacktestTrade["exitReason"] = "TIME";
    let barsHeld = 0;

    for (let j = i + 2; j < bars && barsHeld < config.maxBarsInTrade; j++, barsHeld++) {
      const bar = candles[j];

      if (direction === "LONG") {
        if (bar.low <= stopLoss) {
          exitPrice = stopLoss;
          exitReason = "STOP";
          break;
        }
        if (bar.high >= takeProfit) {
          exitPrice = takeProfit;
          exitReason = "TARGET";
          break;
        }
      } else {
        if (bar.high >= stopLoss) {
          exitPrice = stopLoss;
          exitReason = "STOP";
          break;
        }
        if (bar.low <= takeProfit) {
          exitPrice = takeProfit;
          exitReason = "TARGET";
          break;
        }
      }

      exitPrice = bar.close;
    }

    const grossMove =
      ((exitPrice - entryPrice) / entryPrice) * (direction === "LONG" ? 1 : -1) * 100;
    const pnlPercent = round2(grossMove - costPercent);

    trades.push({
      direction,
      entryPrice,
      exitPrice,
      entryTime: entryBar.time,
      exitTime: candles[Math.min(bars - 1, i + 2 + barsHeld)].time,
      outcome: Math.abs(pnlPercent) < 0.01 ? "BREAKEVEN" : pnlPercent > 0 ? "WIN" : "LOSS",
      pnlPercent,
      barsHeld,
      exitReason,
    });

    equityCurve.push(round2(equityCurve[equityCurve.length - 1] + pnlPercent));

    // Flat until the position is resolved: no overlapping exposure, which keeps
    // the equity curve additive and the statistics interpretable.
    i = i + 2 + barsHeld;
  }

  return { trades, equityCurve };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function summarizeTrades(trades: BacktestTrade[]) {
  const wins = trades.filter((t) => t.outcome === "WIN");
  const losses = trades.filter((t) => t.outcome === "LOSS");
  const breakevens = trades.length - wins.length - losses.length;

  const grossProfit = round2(wins.reduce((a, t) => a + t.pnlPercent, 0));
  const grossLoss = round2(Math.abs(losses.reduce((a, t) => a + t.pnlPercent, 0)));
  const netPnlPercent = round2(trades.reduce((a, t) => a + t.pnlPercent, 0));

  return {
    wins,
    losses,
    breakevens,
    grossProfit,
    grossLoss,
    netPnlPercent,
    winRate: trades.length > 0 ? round2((wins.length / trades.length) * 100) : 0,
    averageWinPercent: wins.length > 0 ? round2(grossProfit / wins.length) : 0,
    averageLossPercent: losses.length > 0 ? round2(grossLoss / losses.length) : 0,
    profitFactor: grossLoss > 0 ? round2(grossProfit / grossLoss) : null,
  };
}

function maxDrawdown(curve: number[]): number {
  let peak = 0;
  let worst = 0;
  for (const point of curve) {
    if (point > peak) peak = point;
    const dd = peak - point;
    if (dd > worst) worst = dd;
  }
  return round2(worst);
}

/**
 * Runs the signal strategy over a deterministic replay of each requested
 * timeframe and aggregates the result.
 *
 * Parameters are fixed before the replay begins and are never re-tuned from the
 * data, so every reported trade is out-of-sample with respect to parameter
 * selection. Costs are charged on every trade. The output is a measured
 * historical win rate for this specific rule set on this specific series —
 * not a forecast, and not a guarantee of any future result.
 */
export function runBacktest(
  config: BacktestConfig,
  timeframes: string[] = ["1H", "4H", "1D"],
  barsPerTimeframe = 900
): BacktestSummary {
  const perTimeframe: BacktestSummary["perTimeframe"] = {};
  const allTrades: BacktestTrade[] = [];

  for (const timeframe of timeframes) {
    const step = TIMEFRAME_SECONDS[timeframe] ?? 3600;
    const factor = Math.max(1, Math.round(step / TIMEFRAME_SECONDS["1H"]));
    const base = buildReplaySeries(config, barsPerTimeframe * factor, timeframe);
    const series = factor > 1 ? aggregateCandles(base, factor) : base;

    const result = replayTimeframe(config, series);
    const stats = summarizeTrades(result.trades);

    perTimeframe[timeframe] = {
      trades: result.trades.length,
      winRate: stats.winRate,
      netPnlPercent: stats.netPnlPercent,
    };

    allTrades.push(...result.trades);
  }

  const stats = summarizeTrades(allTrades);
  const longTrades = allTrades.filter((t) => t.direction === "LONG");
  const shortTrades = allTrades.filter((t) => t.direction === "SHORT");
  const longWins = longTrades.filter((t) => t.outcome === "WIN").length;
  const shortWins = shortTrades.filter((t) => t.outcome === "WIN").length;

  // Equity curve rebuilt across the pooled trades so drawdown reflects the
  // combined sample rather than each timeframe in isolation.
  const pooledCurve = [0];
  for (const trade of allTrades) {
    pooledCurve.push(round2(pooledCurve[pooledCurve.length - 1] + trade.pnlPercent));
  }

  const expectancyPercent =
    allTrades.length > 0 ? round2(stats.netPnlPercent / allTrades.length) : 0;

  return {
    symbol: config.symbol,
    strategy: `Confluence ${config.signalThreshold}+ with ${config.atrStopMultiple} ATR stop / ${config.atrTargetMultiple} ATR target`,
    timeframes,
    totalTrades: allTrades.length,
    wins: stats.wins.length,
    losses: stats.losses.length,
    breakevens: stats.breakevens,
    winRate: stats.winRate,
    netPnlPercent: stats.netPnlPercent,
    averageWinPercent: stats.averageWinPercent,
    averageLossPercent: stats.averageLossPercent,
    profitFactor: stats.profitFactor,
    expectancyPercent,
    maxDrawdownPercent: maxDrawdown(pooledCurve),
    longWinRate:
      longTrades.length > 0 ? round2((longWins / longTrades.length) * 100) : 0,
    shortWinRate:
      shortTrades.length > 0 ? round2((shortWins / shortTrades.length) * 100) : 0,
    perTimeframe,
    methodology:
      `Segmented walk-forward replay over ${barsPerTimeframe} bars per timeframe on a deterministic seeded price series. ` +
      `A position opens when the weighted confluence score exceeds +/-${config.signalThreshold} and fills at the next bar's open. ` +
      `Exit is ${config.atrStopMultiple} ATR stop, ${config.atrTargetMultiple} ATR target, or ${config.maxBarsInTrade} bars. ` +
      `Every trade is charged ${config.costBps} bps of spread and commission. Rules are fixed before the replay and never re-fitted to the sample.`,
    disclaimer:
      "Historical simulation only. This is a measured win rate for one rule set on one synthetic price series, not a promise of future results. Real markets include slippage, gaps and liquidity effects the model does not contain.",
  };
}

/**
 * Converts a measured win rate into the break-even rate implied by the reward
 * ratio, so the readout can state plainly whether the sample beat its own hurdle.
 */
export function breakEvenWinRate(riskReward: number): number {
  if (!Number.isFinite(riskReward) || riskReward <= 0) return 0;
  return round2(clamp((1 / (1 + riskReward)) * 100, 0, 100));
}