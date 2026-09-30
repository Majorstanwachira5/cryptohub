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
 * Generates realistic candlestick history for TradingView charts
 */
export function generateCandleHistory(
  basePrice: number,
  volatility: number,
  count: number = 120,
  intervalSeconds: number = 3600 // 1 hour
): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const digits = basePrice > 10 ? 2 : 5;
  let runningClose = basePrice;

  for (let i = 0; i < count; i++) {
    const time = now - i * intervalSeconds;
    const pctChange = (Math.random() - 0.49) * volatility;
    const open = Math.max(0.0001, runningClose / (1 + pctChange));
    const high = Math.max(open, runningClose) + Math.random() * (volatility * 0.5 * runningClose);
    const low = Math.min(open, runningClose) - Math.random() * (volatility * 0.5 * runningClose);
    const volume = Math.floor(Math.random() * 50000 + 10000);

    candles.push({
      time,
      open: Number(open.toFixed(digits)),
      high: Number(high.toFixed(digits)),
      low: Number(low.toFixed(digits)),
      close: Number(runningClose.toFixed(digits)),
      volume,
    });

    runningClose = open;
  }

  return candles.reverse();
}
