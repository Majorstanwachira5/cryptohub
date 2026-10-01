export type AccountType = "DEMO" | "REAL";
export type AssetClass = "CRYPTO" | "FOREX";
export type TradeDirection = "LONG" | "SHORT";
export type OrderType = "MARKET" | "LIMIT";
export type PositionStatus = "OPEN" | "CLOSED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  btcAddress: string;
  ethAddress: string;
  usdtAddress: string;
  riskTolerancePercent: number;
  hasCompletedRiskQuiz: boolean;
  kycStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  createdAt: string;
}

export interface Balance {
  userId: string;
  accountType: AccountType;
  currency: string;
  availableBalance: number;
  equity: number;
  marginUsed: number;
  freeMargin: number;
  marginLevelPct: number;
  totalDeposited: number;
  updatedAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountType: AccountType;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  orderType: OrderType;
  status: PositionStatus;
  entryPrice: number;
  exitPrice?: number;
  currentPrice: number;
  size: number; // Units for Crypto, Lots for Forex
  leverage: number;
  margin: number;
  stopLoss?: number;
  takeProfit?: number;
  liquidationPrice?: number;
  pnl: number;
  pips: number;
  rationale?: string;
  isBacktest?: boolean;
  openedAt: string;
  closedAt?: string;
}

export type LedgerEntryType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRADE_PROFIT"
  | "TRADE_LOSS"
  | "COMMISSION_FEE"
  | "DEMO_RESET";

export interface LedgerEntry {
  id: string;
  userId: string;
  accountType: AccountType;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  balanceAfter: number;
  txHash?: string;
  description: string;
  createdAt: string;
}

export interface IndicatorMetrics {
  rsi: number;
  rsiSignal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    cross: "BULLISH_CROSS" | "BEARISH_CROSS" | "NEUTRAL";
  };
  ema50: number;
  ema200: number;
  emaTrend: "GOLDEN_ALIGNMENT" | "DEATH_ALIGNMENT" | "NEUTRAL";
}

export interface PredictionResult {
  id: string;
  symbol: string;
  assetClass: AssetClass;
  timeframe: string;
  direction: TradeDirection;
  confidence: number; // 0 to 100
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: string;
  winRateEstimate: string;
  indicators: IndicatorMetrics;
  rationale: string;
  isBacktest?: boolean;
  historicalDate?: string;
  backtestOutcome?: "WIN" | "LOSS";
  isAdminOverride?: boolean;
  createdAt: string;
}

export interface BacktestSetup {
  id: string;
  title: string;
  date: string;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  outcome: "WIN" | "LOSS";
  pnlPercent: number;
  strategyWinRate: string;
  rationale: string;
  disclaimer: string;
}

export interface Candle {
  time: number; // UNIX timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  digits: number;
  spread: number;
}
