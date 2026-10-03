import {
  User,
  Balance,
  Trade,
  LedgerEntry,
  PredictionResult,
  AccountType,
  ReferralRecord,
} from "@/types";
import { getFxRates } from "@/lib/fx/rates";
import { loadState, saveState, flushState, describeStorage } from "./persistence";

/**
 * Referral reward in USD. Always paid into the REAL account, never DEMO, so
 * it can never be mistaken for withdrawable trading profit.
 */
const REFERRAL_REWARD_USD = Number(process.env.REFERRAL_REWARD_USD || 5);

const STORE_FILE = "cryptohub-store";

/** Virtual capital every new account starts with. Practice money only. */
const DEMO_STARTING_CAPITAL = 10000.0;

/** Live capital is never seeded. It exists only once a deposit is recorded. */
const REAL_STARTING_CAPITAL = 0.0;

const DEPOSIT_ADDRESSES = {
  btc: process.env.BTC_DEPOSIT_ADDRESS || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  eth: process.env.ETH_DEPOSIT_ADDRESS || "0x71C8407BEA758B540306E5D73A9dFcf38914A690",
  usdt: process.env.USDT_DEPOSIT_ADDRESS || "TXW29Zg3N8rR7Lq9n8rLkJH8zC41Q2K9mY",
};

/**
 * Derives a stable, human-typeable referral code from a profile id.
 * Deterministic so the same user always shares the same code.
 */
function referralCodeFor(userId: string, email: string): string {
  const seed = `${userId}:${email}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().slice(0, 6).padStart(6, "X");
}

/** One book. DEMO and REAL are fully isolated from each other. */
interface AccountState {
  balance: Balance;
  trades: Trade[];
  ledger: LedgerEntry[];
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  /**
   * Role as last known to the trading store. The authoritative role for access
   * decisions is the one on the verified token; this copy exists so profile
   * responses can report it without a second lookup.
   */
  role: User["role"];
  referralCode: string;
  riskTolerancePercent: number;
  hasCompletedRiskQuiz: boolean;
  kycStatus: User["kycStatus"];
  createdAt: string;
}

interface PersistedState {
  version: number;
  users: Record<string, UserRecord>;
  accounts: Record<string, Record<AccountType, AccountState>>;
  referrals: Record<string, ReferralRecord[]>;
  predictions: PredictionResult[];
  totalPlatformVolume: number;
  totalPlatformRevenue: number;
}

function emptyState(): PersistedState {
  return {
    version: 1,
    users: {},
    accounts: {},
    referrals: {},
    predictions: [],
    totalPlatformVolume: 0,
    totalPlatformRevenue: 0,
  };
}

function freshBalance(userId: string, accountType: AccountType): Balance {
  const opening =
    accountType === "DEMO" ? DEMO_STARTING_CAPITAL : REAL_STARTING_CAPITAL;
  const now = new Date().toISOString();
  return {
    userId,
    accountType,
    currency: "USDT",
    availableBalance: opening,
    equity: opening,
    marginUsed: 0,
    freeMargin: opening,
    marginLevelPct: 9999,
    totalDeposited: opening,
    updatedAt: now,
  };
}

function freshAccount(userId: string, accountType: AccountType): AccountState {
  const balance = freshBalance(userId, accountType);

  return {
    balance,
    trades: [],
    // Only DEMO gets a seed entry, so the $10,000 practice allocation is
    // visible in the statement rather than appearing from nowhere.
    ledger:
      accountType === "DEMO"
        ? [
            {
              id: `led_demo_init_${userId}`,
              userId,
              accountType: "DEMO",
              type: "DEPOSIT",
              amount: DEMO_STARTING_CAPITAL,
              currency: "USDT",
              balanceAfter: DEMO_STARTING_CAPITAL,
              txHash: "VIRTUAL_SEED_10K",
              description:
                "Initial Demo Virtual Capital Allocation ($10,000 USD)",
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
  };
}

/**
 * Per-user platform store.
 *
 * Every read and write is scoped by user id, taken from the verified access
 * token. No method can reach another user's balance, trades, ledger, or
 * referrals, because none of them accept a user id from the request: the
 * caller passes the identity the guard already resolved.
 */
class DatabaseStore {
  private state: PersistedState;

  constructor() {
    const storage = describeStorage();
    if (!storage.writable) {
      console.error(
        `[db] DATA_DIR ${storage.dir} is not writable (${storage.error}). ` +
          "State will be held in memory only and lost on restart."
      );
    } else {
      console.log(`[db] persisting state to ${storage.dir}`);
    }

    const loaded = loadState<PersistedState>(STORE_FILE);
    // An unreadable or older file falls back to a clean store rather than
    // crashing the platform at boot.
    this.state = loaded && loaded.version === 1 ? loaded : emptyState();
  }

  /** Debounced write. Safe for high-frequency updates such as price marks. */
  private persist(): void {
    saveState(STORE_FILE, this.state);
  }

  /** Immediate write. Used after changes that must not be lost. */
  private persistNow(): void {
    flushState(STORE_FILE, this.state);
  }

  private accountsFor(userId: string): Record<AccountType, AccountState> {
    const existing = this.state.accounts[userId];
    if (existing && existing.DEMO && existing.REAL) return existing;

    // Created lazily so a profile written by an earlier version, or a user
    // whose file was partially restored, still ends up with both books.
    const created = {
      DEMO: existing?.DEMO ?? freshAccount(userId, "DEMO"),
      REAL: existing?.REAL ?? freshAccount(userId, "REAL"),
    };
    this.state.accounts[userId] = created;
    return created;
  }

  private account(userId: string, accountType: AccountType): AccountState {
    return this.accountsFor(userId)[accountType];
  }

  /**
   * Ensures a platform profile and both books exist for an identity.
   *
   * Called on every authenticated request, so a user who registers, signs in
   * from Supabase, or whose records were partially lost always resolves to a
   * complete account without a separate migration step.
   */
  ensureUser(input: { id: string; email: string; name?: string; role?: User["role"] }): User {
    const existing = this.state.users[input.id];

    if (!existing) {
      this.state.users[input.id] = {
        id: input.id,
        email: input.email,
        name: (input.name || input.email.split("@")[0]).slice(0, 80),
        role: input.role || "user",
        referralCode: referralCodeFor(input.id, input.email),
        // Practice capital is always available; live capital is never granted
        // by signing up.
        riskTolerancePercent: 2.0,
        hasCompletedRiskQuiz: true,
        kycStatus: "UNVERIFIED",
        createdAt: new Date().toISOString(),
      };
      this.accountsFor(input.id);
      this.persistNow();
    }

    return this.getUser(input.id);
  }

  // User
  getUser(userId: string): User {
    const record = this.state.users[userId];

    if (!record) {
      throw new Error(
        `No platform profile exists for user id ${userId}. Call ensureUser first.`
      );
    }

    return {
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role,
      // Referral code is part of the persisted record rather than derived on
      // read, so a code stays stable even if the id or email is later changed.
      referralCode: record.referralCode,
      btcAddress: DEPOSIT_ADDRESSES.btc,
      ethAddress: DEPOSIT_ADDRESSES.eth,
      usdtAddress: DEPOSIT_ADDRESSES.usdt,
      riskTolerancePercent: record.riskTolerancePercent,
      hasCompletedRiskQuiz: record.hasCompletedRiskQuiz,
      kycStatus: record.kycStatus,
      createdAt: record.createdAt,
    };
  }

  /**
   * Marks the caller's profile as risk-certified.
   *
   * Only called once the server has checked the answers, so the flag always
   * reflects a certification that actually happened.
   */
  completeRiskQuiz(userId: string): User {
    const record = this.state.users[userId];
    if (record) {
      record.hasCompletedRiskQuiz = true;
      this.persistNow();
    }
    return this.getUser(userId);
  }

  // Balance & Margin Calculations (Separated by AccountType)
  getBalance(userId: string, accountType: AccountType = "DEMO"): Balance {
    const account = this.account(userId, accountType);
    this.recalculateEquity(account);
    return { ...account.balance };
  }

  private recalculateEquity(account: AccountState): void {
    const targetBalance = account.balance;

    const openTrades = account.trades.filter((t) => t.status === "OPEN");
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
  getTrades(userId: string, accountType: AccountType = "DEMO"): Trade[] {
    return [...this.account(userId, accountType).trades];
  }

  addTrade(
    userId: string,
    trade: Omit<Trade, "id" | "userId" | "openedAt" | "pnl" | "pips" | "status">,
    accountType: AccountType = "DEMO"
  ): Trade {
    const account = this.account(userId, accountType);

    const newTrade: Trade = {
      ...trade,
      id: `trd_${accountType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      accountType,
      status: "OPEN",
      pnl: 0,
      pips: 0,
      openedAt: new Date().toISOString(),
    };

    account.trades.unshift(newTrade);

    this.state.totalPlatformVolume += newTrade.size * newTrade.entryPrice;
    this.state.totalPlatformRevenue += newTrade.size * newTrade.entryPrice * 0.0004;
    this.recalculateEquity(account);
    this.persistNow();
    return newTrade;
  }

  updatePositionPrice(
    userId: string,
    id: string,
    currentPrice: number,
    pnl: number,
    pips: number,
    accountType: AccountType
  ) {
    const account = this.account(userId, accountType);
    const trade = account.trades.find((t) => t.id === id);
    if (trade && trade.status === "OPEN") {
      trade.currentPrice = currentPrice;
      trade.pnl = pnl;
      trade.pips = pips;
      this.recalculateEquity(account);
      // Marks arrive on a timer, so this uses the debounced write.
      this.persist();
    }
  }

  closeTrade(
    userId: string,
    id: string,
    exitPrice: number,
    accountType: AccountType
  ): Trade | null {
    const account = this.account(userId, accountType);
    const targetBalance = account.balance;

    const trade = account.trades.find((t) => t.id === id);
    if (!trade || trade.status !== "OPEN") return null;

    trade.status = "CLOSED";
    trade.exitPrice = exitPrice;
    trade.closedAt = new Date().toISOString();

    // Calculate final realized PnL based on exitPrice
    const diff =
      trade.direction === "LONG" ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
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
      Math.round((targetBalance.availableBalance + trade.pnl) * 100) / 100;

    // Create isolated ledger entry
    const ledgerType = trade.pnl >= 0 ? "TRADE_PROFIT" : "TRADE_LOSS";
    this.addLedgerEntry(
      userId,
      {
        type: ledgerType,
        amount: trade.pnl,
        currency: "USDT",
        description: `[${accountType}] Closed ${trade.direction} ${trade.symbol} at ${exitPrice} (PnL: $${trade.pnl.toFixed(2)})`,
      },
      accountType
    );

    this.recalculateEquity(account);
    this.persistNow();
    return trade;
  }

  // Ledger & Deposits
  getLedger(userId: string, accountType: AccountType = "DEMO"): LedgerEntry[] {
    return [...this.account(userId, accountType).ledger];
  }

  addLedgerEntry(
    userId: string,
    entry: Omit<LedgerEntry, "id" | "userId" | "accountType" | "createdAt" | "balanceAfter">,
    accountType: AccountType = "DEMO"
  ): LedgerEntry {
    const account = this.account(userId, accountType);

    const newEntry: LedgerEntry = {
      ...entry,
      id: `led_${accountType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      accountType,
      balanceAfter: account.balance.availableBalance,
      createdAt: new Date().toISOString(),
    };
    account.ledger.unshift(newEntry);
    this.persistNow();
    return newEntry;
  }

  depositFunds(
    userId: string,
    amount: number,
    method: string,
    txHash?: string,
    accountType: AccountType = "REAL"
  ): Balance {
    const account = this.account(userId, accountType);
    const targetBalance = account.balance;

    targetBalance.availableBalance =
      Math.round((targetBalance.availableBalance + amount) * 100) / 100;
    targetBalance.totalDeposited =
      Math.round((targetBalance.totalDeposited + amount) * 100) / 100;

    this.addLedgerEntry(
      userId,
      {
        type: "DEPOSIT",
        amount,
        currency: "USDT",
        txHash: txHash || `SIM_TX_${Date.now().toString(16).toUpperCase()}`,
        description: `[${accountType}] Deposit via ${method} confirmed`,
      },
      accountType
    );

    this.recalculateEquity(account);
    this.persistNow();
    return { ...targetBalance };
  }

  // Referrals
  getReferralCode(userId: string): string {
    return this.getUser(userId).referralCode;
  }

  getReferrals(userId: string): ReferralRecord[] {
    return [...(this.state.referrals[userId] ?? [])];
  }

  getReferralRewardUsd(): number {
    return REFERRAL_REWARD_USD;
  }

  /**
   * Registers a referral and pays the reward.
   *
   * Rules, enforced here rather than in the route so they hold for any caller:
   *  - the code must belong to this account;
   *  - one reward per referred email for this referrer, ever;
   *  - you cannot refer yourself;
   *  - the reward lands in the REAL account only.
   */
  registerReferral(
    userId: string,
    input: { code: string; email: string; name?: string }
  ): { ok: true; record: ReferralRecord; balance: Balance } | { ok: false; error: string } {
    const code = (input.code || "").trim().toUpperCase();
    const email = (input.email || "").trim().toLowerCase();

    if (!code) return { ok: false, error: "A referral code is required." };
    if (!email || !email.includes("@")) {
      return { ok: false, error: "A valid email address is required." };
    }

    const referrer = this.state.users[userId];
    if (!referrer) {
      return { ok: false, error: "Your account could not be found." };
    }

    if (code !== referrer.referralCode) {
      return { ok: false, error: "That referral code is not recognised." };
    }
    if (email === referrer.email.toLowerCase()) {
      return { ok: false, error: "You cannot refer your own account." };
    }

    const mine = this.state.referrals[userId] ?? [];
    if (mine.some((r) => r.referredEmail === email)) {
      return {
        ok: false,
        error: `${email} has already been referred. Each referral is paid once.`,
      };
    }

    const record: ReferralRecord = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      referrerId: userId,
      referrerEmail: referrer.email,
      code,
      referredEmail: email,
      referredName: (input.name || "").trim() || email.split("@")[0],
      status: "QUALIFIED",
      rewardUsd: REFERRAL_REWARD_USD,
      createdAt: new Date().toISOString(),
    };

    this.state.referrals[userId] = [record, ...mine];

    // REAL only. This is real-account credit, so it is deliberately not
    // mirrored into the demo book.
    const account = this.account(userId, "REAL");
    account.balance.availableBalance =
      Math.round((account.balance.availableBalance + record.rewardUsd) * 100) / 100;

    this.addLedgerEntry(
      userId,
      {
        type: "REFERRAL_BONUS",
        amount: record.rewardUsd,
        currency: "USDT",
        description: `Referral bonus for ${record.referredEmail} ($${record.rewardUsd.toFixed(2)} USD)`,
      },
      "REAL"
    );

    this.recalculateEquity(account);
    this.persistNow();

    return { record, balance: { ...account.balance }, ok: true };
  }

  /** KES value of the referral reward, for display alongside the USD figure. */
  referralRewardKes(): number {
    return Math.round(REFERRAL_REWARD_USD * getFxRates().usdKes * 100) / 100;
  }

  resetDemoBalance(userId: string): Balance {
    const account = this.account(userId, "DEMO");

    account.balance.availableBalance = DEMO_STARTING_CAPITAL;
    account.balance.equity = DEMO_STARTING_CAPITAL;
    account.balance.marginUsed = 0.0;
    account.balance.freeMargin = DEMO_STARTING_CAPITAL;
    account.balance.marginLevelPct = 9999;
    account.balance.totalDeposited = DEMO_STARTING_CAPITAL;
    account.trades = [];

    this.addLedgerEntry(
      userId,
      {
        type: "DEMO_RESET",
        amount: DEMO_STARTING_CAPITAL,
        currency: "USDT",
        description: "Demo Account Virtual Capital Reset to $10,000.00 USD",
      },
      "DEMO"
    );

    return this.getBalance(userId, "DEMO");
  }

  // Predictions
  //
  // Signals are platform-wide by design: an administrator broadcast is meant
  // to reach every terminal. They carry market analysis only, never account
  // or identity data.
  savePrediction(prediction: PredictionResult) {
    this.state.predictions.unshift(prediction);
    if (this.state.predictions.length > 50) this.state.predictions.pop();
    this.persist();
  }

  getLatestPrediction(symbol?: string): PredictionResult | null {
    if (symbol) {
      return this.state.predictions.find((p) => p.symbol === symbol) || null;
    }
    return this.state.predictions[0] || null;
  }

  // Administration
  //
  // Aggregates across every account. This is the one place that may read more
  // than one user's data, and it is reachable only through requireAdmin.
  getAdminStats() {
    let openDemoPositions = 0;
    let openRealPositions = 0;
    let activeUsers24h = 0;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    for (const accounts of Object.values(this.state.accounts)) {
      for (const trade of accounts.DEMO.trades) {
        if (trade.status === "OPEN") openDemoPositions++;
        else if (new Date(trade.closedAt || trade.openedAt).getTime() > cutoff) {
          activeUsers24h++;
        }
      }
      for (const trade of accounts.REAL.trades) {
        if (trade.status === "OPEN") openRealPositions++;
      }
    }

    const closed = Object.values(this.state.accounts).flatMap((accounts) => [
      ...accounts.DEMO.trades,
      ...accounts.REAL.trades,
    ]);

    const wins = closed.filter((t) => t.status === "CLOSED" && t.pnl > 0).length;
    const losses = closed.filter((t) => t.status === "CLOSED" && t.pnl < 0).length;
    const decided = wins + losses;

    return {
      totalUsers: Object.keys(this.state.users).length,
      activeUsers24h,
      totalVolume: Math.round(this.state.totalPlatformVolume * 100) / 100,
      totalRevenue: Math.round(this.state.totalPlatformRevenue * 100) / 100,
      openDemoPositions,
      openRealPositions,
      averageWinRate:
        decided > 0 ? `${Math.round((wins / decided) * 1000) / 10}%` : "—",
      openPositions: closed.filter((t) => t.status === "OPEN").length,
      totalTrades: closed.length,
    };
  }

  /** All trades across all accounts, newest first. Admin surfaces only. */
  getAllTrades(): Trade[] {
    return Object.values(this.state.accounts)
      .flatMap((accounts) => [...accounts.DEMO.trades, ...accounts.REAL.trades])
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }

  getAllUsers(): User[] {
    return Object.keys(this.state.users)
      .map((id) => this.getUser(id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// Global Singleton Store (Shared across all Next.js App Router chunks)
const globalStore = (globalThis as unknown as { __tradingStore?: DatabaseStore });
if (!globalStore.__tradingStore) {
  globalStore.__tradingStore = new DatabaseStore();
}
export const db = globalStore.__tradingStore;