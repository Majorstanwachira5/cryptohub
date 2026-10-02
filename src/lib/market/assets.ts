import { MarketAsset, Candle } from "@/types";

export const DEFAULT_ASSETS: MarketAsset[] = [
  {
    symbol: "BTCUSDT",
    name: "Bitcoin / Tether",
    assetClass: "CRYPTO",
    currentPrice: 64520.0,
    change24h: 3.42,
    high24h: 65180.0,
    low24h: 62410.0,
    volume24h: "3.2B",
    digits: 2,
    spread: 0.5,
  },
  {
    symbol: "ETHUSDT",
    name: "Ethereum / Tether",
    assetClass: "CRYPTO",
    currentPrice: 3485.5,
    change24h: 4.18,
    high24h: 3540.0,
    low24h: 3320.0,
    volume24h: "1.8B",
    digits: 2,
    spread: 0.2,
  },
  {
    symbol: "SOLUSDT",
    name: "Solana / Tether",
    assetClass: "CRYPTO",
    currentPrice: 158.4,
    change24h: 6.85,
    high24h: 162.1,
    low24h: 147.5,
    volume24h: "840M",
    digits: 2,
    spread: 0.05,
  },
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    assetClass: "FOREX",
    currentPrice: 1.08642,
    change24h: 0.35,
    high24h: 1.0891,
    low24h: 1.0821,
    volume24h: "98.4B",
    digits: 5,
    spread: 0.00012,
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    assetClass: "FOREX",
    currentPrice: 1.3045,
    change24h: 0.52,
    high24h: 1.3092,
    low24h: 1.2985,
    volume24h: "62.1B",
    digits: 5,
    spread: 0.00018,
  },
  {
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    assetClass: "FOREX",
    currentPrice: 154.28,
    change24h: -0.42,
    high24h: 155.1,
    low24h: 153.85,
    volume24h: "74.8B",
    digits: 3,
    spread: 0.015,
  },
];

/**
 * Deterministic pseudo-random generator (mulberry32).
 * Analysis output must be reproducible: a user refreshing the panel should not
 * see a different verdict each time, and backtests must replay identically.
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string hash, used to derive per-symbol seeds. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Box-Muller transform: uniform noise into a normal distribution. */
function gaussian(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generates realistic candlestick history for TradingView charts.
 *
 * Walks forward from a seed price with mean-reverting drift and gaussian noise
 * so the series has the autocorrelation and volatility clustering of a traded
 * market rather than pure white noise. When `seed` is omitted the series is
 * derived from basePrice, making it reproducible across requests.
 */
export function generateCandleHistory(
  basePrice: number,
  volatility: number,
  count: number = 120,
  intervalSeconds: number = 3600,
  seed?: number
): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const digits = basePrice > 1000 ? 2 : basePrice > 10 ? 2 : basePrice > 1 ? 5 : 3;

  const effectiveSeed =
    seed ?? hashSeed(`${basePrice.toFixed(6)}:${volatility}:${count}:${intervalSeconds}`);
  const rand = createSeededRandom(effectiveSeed);

  // Per-step volatility, drifting around the requested base volatility
  let volState = volatility;
  let close = basePrice * (1 - volatility * 0.35);

  // Two slow-moving components shape the walk:
  //  - `trend` is an AR(1) drift that persists for roughly a hundred bars, so
  //    the series contains genuine trends rather than pure noise.
  //  - `pull` is a very gentle pull back toward the anchor price, with a
  //    half-life of ~170 bars. Without it a long series wanders far enough
  //    that the final rescale would flatten the earlier history; with a short
  //    half-life instead the series becomes a damped oscillation and momentum
  //    signals stop carrying any information at all.
  let trend = 0;

  // Walk forward in time so bar N is the most recent
  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * intervalSeconds;

    // Volatility clustering: occasional regime shifts that decay back to mean
    volState = volState * 0.94 + volatility * 0.06;
    const shock = rand() < 0.04 ? 2.6 : 1;
    const stepVol = volState * shock;

    trend = trend * 0.99 + gaussian(rand) * volatility * 0.05;
    const pull = Math.log(basePrice / close) * 0.004;
    const change = gaussian(rand) * stepVol + trend + pull;
    const open = close;
    close = Math.max(0.0001, open * (1 + change));

    const wick = Math.abs(gaussian(rand)) * stepVol * 0.6;
    const high = Math.max(open, close) * (1 + Math.abs(wick) * 0.5);
    const low = Math.min(open, close) * (1 - Math.abs(wick) * 0.5);
    const volume = Math.floor(rand() * 50000 + 10000);

    candles.push({
      time,
      open: Number(open.toFixed(digits)),
      high: Number(high.toFixed(digits)),
      low: Number(low.toFixed(digits)),
      close: Number(close.toFixed(digits)),
      volume,
    });
  }

  // Anchor the final close to the live quoted price so analysis matches the UI
  const last = candles[candles.length - 1];
  if (last) {
    const scale = basePrice / last.close;
    for (const c of candles) {
      c.open = Number((c.open * scale).toFixed(digits));
      c.high = Number((c.high * scale).toFixed(digits));
      c.low = Number((c.low * scale).toFixed(digits));
      c.close = Number((c.close * scale).toFixed(digits));
    }
  }

  return candles;
}
