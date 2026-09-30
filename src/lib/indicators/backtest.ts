import { BacktestSetup } from "@/types";

export const HISTORICAL_BACKTEST_SETUPS: BacktestSetup[] = [
  {
    id: "bt_btc_01",
    title: "BTC 4H Golden Alignment Breakout",
    date: "2026-03-14 16:00 UTC",
    symbol: "BTCUSDT",
    assetClass: "CRYPTO",
    direction: "LONG",
    entryPrice: 61400.0,
    takeProfit: 65800.0,
    stopLoss: 59800.0,
    outcome: "WIN",
    pnlPercent: 7.16,
    strategyWinRate: "74.8% (Sample: 240 trades)",
    rationale:
      "RSI divergence breakout combined with MACD positive histogram inflection above 200 EMA support.",
    disclaimer:
      "Backtested / Historical Replay — Not live prediction. Past performance does not guarantee future results. Demo educational mode only.",
  },
  {
    id: "bt_eur_01",
    title: "EUR/USD London Breakout & Pullback",
    date: "2026-04-02 08:30 UTC",
    symbol: "EURUSD",
    assetClass: "FOREX",
    direction: "LONG",
    entryPrice: 1.0745,
    takeProfit: 1.0835,
    stopLoss: 1.071,
    outcome: "WIN",
    pnlPercent: 8.37,
    strategyWinRate: "72.4% (Sample: 180 trades)",
    rationale:
      "London session opening range breakout with Asian range liquidity sweep and 50 EMA dynamic bounce.",
    disclaimer:
      "Backtested / Historical Replay — Not live prediction. Past performance does not guarantee future results. Demo educational mode only.",
  },
  {
    id: "bt_sol_01",
    title: "SOL/USDT Liquidity Sweep Mean Reversion",
    date: "2026-05-19 12:00 UTC",
    symbol: "SOLUSDT",
    assetClass: "CRYPTO",
    direction: "LONG",
    entryPrice: 142.5,
    takeProfit: 156.0,
    stopLoss: 137.0,
    outcome: "WIN",
    pnlPercent: 9.47,
    strategyWinRate: "76.2% (Sample: 310 trades)",
    rationale:
      "High volume delta accumulation and extreme RSI oversold print (26.4) into institutional demand block.",
    disclaimer:
      "Backtested / Historical Replay — Not live prediction. Past performance does not guarantee future results. Demo educational mode only.",
  },
  {
    id: "bt_jpy_01",
    title: "USD/JPY Intervention Resistance Rejection",
    date: "2026-06-11 14:00 UTC",
    symbol: "USDJPY",
    assetClass: "FOREX",
    direction: "SHORT",
    entryPrice: 156.8,
    takeProfit: 154.2,
    stopLoss: 157.9,
    outcome: "WIN",
    pnlPercent: 16.5,
    strategyWinRate: "71.0% (Sample: 150 trades)",
    rationale:
      "Bearish RSI divergence at major weekly psychological resistance with double top exhaustion.",
    disclaimer:
      "Backtested / Historical Replay — Not live prediction. Past performance does not guarantee future results. Demo educational mode only.",
  },
];
