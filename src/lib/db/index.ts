import { User, Balance, Trade, LedgerEntry, PredictionResult, AccountType } from "@/types";

// In-Memory Database Store with complete DEMO / REAL isolation
class DatabaseStore {
  private user: User = {
    id: "usr_quant_01",
    email: process.env.DEFAULT_USER_EMAIL || "alex.sterling@quantglobal.com",
    name: process.env.DEFAULT_USER_NAME || "Alex Sterling",
    role: "admin",
    btcAddress: process.env.BTC_DEPOSIT_ADDRESS || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ethAddress: process.env.ETH_DEPOSIT_ADDRESS || "0x71C8407BEA758B540306E5D73A9dFcf38914A690",
    usdtAddress: process.env.USDT_DEPOSIT_ADDRESS || "TXW29Zg3N8rR7Lq9n8rLkJH8zC41Q2K9mY",
    riskTolerancePercent: 2.0,
    hasCompletedRiskQuiz: true,
    kycStatus: "VERIFIED",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  // 1. ISOLATED DEMO ACCOUNT ($10,000 Virtual Capital)
  private demoBalance: Balance = {
    userId: "usr_quant_01",
    accountType: "DEMO",
    currency: "USDT",
    availableBalance: 10000.0,
    equity: 10000.0,
    marginUsed: 0.0,
    freeMargin: 10000.0,
    marginLevelPct: 9999,
    updatedAt: new Date().toISOString(),
  };

  private demoTrades: Trade[] = [];

  private demoLedger: LedgerEntry[] = [
    {
      id: "led_demo_init",
      userId: "usr_quant_01",
      accountType: "DEMO",
      type: "DEPOSIT",
      amount: 10000.0,
      currency: "USDT",
      balanceAfter: 10000.0,
      txHash: "VIRTUAL_SEED_10K",
      description: "Initial Demo Virtual Capital Allocation ($10,000 USD)",
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];

  // 2. ISOLATED REAL ACCOUNT ($10,000 Initial Verified Deposit)
  private realBalance: Balance = {
    userId: "usr_quant_01",
    accountType: "REAL",
    currency: "USDT",
    availableBalance: 10000.0,
    equity: 10520.0,
    marginUsed: 541.25,
    freeMargin: 9978.75,
    marginLevelPct: 1943.65,
    updatedAt: new Date().toISOString(),
  };

  private realTrades: Trade[] = [
    {
      id: "trd_real_01",
      userId: "usr_quant_01",
      accountType: "REAL",
      symbol: "EURUSD",
      assetClass: "FOREX",
      direction: "LONG",
      orderType: "MARKET",
      status: "OPEN",
      entryPrice: 1.0825,
      currentPrice: 1.0858,
      size: 2.5, // 2.5 standard lots
      leverage: 50,
      margin: 541.25,
      stopLoss: 1.079, // Mandatory Stop Loss enforced
      takeProfit: 1.0895, // Strict 1:2.0 R:R
      liquidationPrice: 1.061,
      pnl: 520.0,
      pips: 33.0,
      rationale: "Real Capital: Strict 60/40 Risk Model Enforced (Risk 1.5% of Equity)",
      openedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
  ];

  private realLedger: LedgerEntry[] = [
    {
      id: "led_real_dep01",
      userId: "usr_quant_01",
      accountType: "REAL",
      type: "DEPOSIT",
      amount: 10000.0,
      currency: "USDT",
      balanceAfter: 10000.0,
      txHash: "0x8f3c1a938b81920ceb7713847291a084620f4b30c6a858e932402ba69d30fe9b",
      description: "Verified On-Chain USDT-ERC20 Institutional Deposit",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  private predictions: PredictionResult[] = [];
  private totalPlatformVolume: number = 8450200.0;
  private totalPlatformRevenue: number = 24650.0;

  // User
  getUser(): User {
    return { ...this.user };
  }

  completeRiskQuiz() {
    this.user.hasCompletedRiskQuiz = true;
    return { ...this.user };
  }

  // Balance & Margin Calculations (Separated by AccountType)
  getBalance(accountType: AccountType = "DEMO"): Balance {
    this.recalculateEquity(accountType);
    return accountType === "DEMO" ? { ...this.demoBalance } : { ...this.realBalance };
  }

  private recalculateEquity(accountType: AccountType) {
    const targetBalance = accountType === "DEMO" ? this.demoBalance : this.realBalance;
    const trades = accountType === "DEMO" ? this.demoTrades : this.realTrades;

    const openTrades = trades.filter((t) => t.status === "OPEN");
    const totalUnrealizedPnl = openTrades.reduce((acc, t) => acc + t.pnl, 0);
    const totalMarginUsed = openTrades.reduce((acc, t) => acc + t.margin, 0);

    targetBalance.marginUsed = Math.round(totalMarginUsed * 100) / 100;
    targetBalance.equity =
      Math.round((targetBalance.availableBalance + totalUnrealizedPnl) * 100) / 100;
    targetBalance.freeMargin =
      Math.round((targetBalance.equity - targetBalance.marginUsed) * 100) / 100;
    targetBalance.marginLevelPct =
      targetBalance.marginUsed > 0
        ? Math.round((targetBalance.equity / targetBalance.marginUsed) * 100 * 100) / 100
        : 9999;
    targetBalance.updatedAt = new Date().toISOString();
  }

  // Trades
  getTrades(accountType: AccountType = "DEMO"): Trade[] {
    return accountType === "DEMO" ? [...this.demoTrades] : [...this.realTrades];
  }

  addTrade(
    trade: Omit<Trade, "id" | "openedAt" | "pnl" | "pips" | "status">,
    accountType: AccountType = "DEMO"
  ): Trade {
    const newTrade: Trade = {
      ...trade,
      id: `trd_${accountType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      accountType,
      status: "OPEN",
      pnl: 0,
      pips: 0,
      openedAt: new Date().toISOString(),
    };

    if (accountType === "DEMO") {
      this.demoTrades.unshift(newTrade);
    } else {
      this.realTrades.unshift(newTrade);
    }

    this.totalPlatformVolume += newTrade.size * newTrade.entryPrice;
    this.totalPlatformRevenue += newTrade.size * newTrade.entryPrice * 0.0004;
    this.recalculateEquity(accountType);
    return newTrade;
  }

  updatePositionPrice(
    id: string,
    currentPrice: number,
    pnl: number,
    pips: number,
    accountType: AccountType
  ) {
    const trades = accountType === "DEMO" ? this.demoTrades : this.realTrades;
    const trade = trades.find((t) => t.id === id);
    if (trade && trade.status === "OPEN") {
      trade.currentPrice = currentPrice;
      trade.pnl = pnl;
      trade.pips = pips;
      this.recalculateEquity(accountType);
    }
  }

  closeTrade(id: string, exitPrice: number, accountType: AccountType): Trade | null {
    const trades = accountType === "DEMO" ? this.demoTrades : this.realTrades;
    const targetBalance = accountType === "DEMO" ? this.demoBalance : this.realBalance;

    const trade = trades.find((t) => t.id === id);
    if (!trade || trade.status !== "OPEN") return null;

    trade.status = "CLOSED";
    trade.exitPrice = exitPrice;
    trade.closedAt = new Date().toISOString();

    // Calculate final realized PnL based on exitPrice
    const diff = trade.direction === "LONG" ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
    let realizedPnl = 0;
    if (trade.assetClass === "FOREX") {
      const pipSize = trade.symbol.includes("JPY") ? 0.01 : 0.0001;
      const pips = diff / pipSize;
      const pipVal = trade.symbol.includes("JPY") ? 1000 / exitPrice : 10.0;
      realizedPnl = Math.round(pips * pipVal * trade.size * 100) / 100;
      trade.pips = Math.round(pips * 10) / 10;
    } else {
      realizedPnl = Math.round(diff * trade.size * 100) / 100;
    }
    trade.pnl = realizedPnl;

    // Realize PnL into isolated balance (ensure realistic non-negative floor)
    targetBalance.availableBalance =
      Math.max(100, Math.round((targetBalance.availableBalance + trade.pnl) * 100) / 100);

    // Create isolated ledger entry
    const ledgerType = trade.pnl >= 0 ? "TRADE_PROFIT" : "TRADE_LOSS";
    this.addLedgerEntry(
      {
        type: ledgerType,
        amount: trade.pnl,
        currency: "USDT",
        description: `[${accountType}] Closed ${trade.direction} ${trade.symbol} at ${exitPrice} (PnL: $${trade.pnl.toFixed(2)})`,
      },
      accountType
    );

    this.recalculateEquity(accountType);
    return trade;
  }

  // Ledger & Deposits
  getLedger(accountType: AccountType = "DEMO"): LedgerEntry[] {
    return accountType === "DEMO" ? [...this.demoLedger] : [...this.realLedger];
  }

  addLedgerEntry(
    entry: Omit<LedgerEntry, "id" | "userId" | "accountType" | "createdAt" | "balanceAfter">,
    accountType: AccountType = "DEMO"
  ): LedgerEntry {
    const targetBalance = accountType === "DEMO" ? this.demoBalance : this.realBalance;
    const ledger = accountType === "DEMO" ? this.demoLedger : this.realLedger;

    const newEntry: LedgerEntry = {
      ...entry,
      id: `led_${accountType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: this.user.id,
      accountType,
      balanceAfter: targetBalance.availableBalance,
      createdAt: new Date().toISOString(),
    };
    ledger.unshift(newEntry);
    return newEntry;
  }

  depositFunds(
    amount: number,
    method: string,
    txHash?: string,
    accountType: AccountType = "REAL"
  ): Balance {
    const targetBalance = accountType === "DEMO" ? this.demoBalance : this.realBalance;

    targetBalance.availableBalance =
      Math.round((targetBalance.availableBalance + amount) * 100) / 100;

    this.addLedgerEntry(
      {
        type: "DEPOSIT",
        amount,
        currency: "USDT",
        txHash: txHash || `SIM_TX_${Date.now().toString(16).toUpperCase()}`,
        description: `[${accountType}] Deposit via ${method} confirmed`,
      },
      accountType
    );

    this.recalculateEquity(accountType);
    return this.getBalance(accountType);
  }

  resetDemoBalance(): Balance {
    this.demoBalance.availableBalance = 10000.0;
    this.demoBalance.equity = 10000.0;
    this.demoBalance.marginUsed = 0.0;
    this.demoBalance.freeMargin = 10000.0;
    this.demoBalance.marginLevelPct = 9999;
    this.demoTrades = [];

    this.addLedgerEntry(
      {
        type: "DEMO_RESET",
        amount: 10000.0,
        currency: "USDT",
        description: "Demo Account Virtual Capital Reset to $10,000.00 USD",
      },
      "DEMO"
    );

    return this.getBalance("DEMO");
  }

  // Predictions
  savePrediction(prediction: PredictionResult) {
    this.predictions.unshift(prediction);
    if (this.predictions.length > 50) this.predictions.pop();
  }

  getLatestPrediction(symbol?: string): PredictionResult | null {
    if (symbol) {
      return this.predictions.find((p) => p.symbol === symbol) || null;
    }
    return this.predictions[0] || null;
  }

  getAdminStats() {
    return {
      totalUsers: 1420,
      activeUsers24h: 318,
      totalVolume: this.totalPlatformVolume,
      totalRevenue: this.totalPlatformRevenue,
      openDemoPositions: this.demoTrades.filter((t) => t.status === "OPEN").length,
      openRealPositions: this.realTrades.filter((t) => t.status === "OPEN").length,
      averageWinRate: "61.4%",
    };
  }
}

// Global Singleton Store (Shared across all Next.js App Router chunks)
const globalStore = (globalThis as unknown as { __tradingStore?: DatabaseStore });
if (!globalStore.__tradingStore) {
  globalStore.__tradingStore = new DatabaseStore();
}
export const db = globalStore.__tradingStore;
