-- ============================================================================
-- CRYPTOHUB TRADING PLATFORM - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Fully compatible with Supabase Auth, Row Level Security (RLS), and Realtime
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users or standalone platform accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Trader',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    btc_deposit_address TEXT DEFAULT 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    eth_deposit_address TEXT DEFAULT '0x71C8407BEA758B540306E5D73A9dFcf38914A690',
    usdt_trc20_address TEXT DEFAULT 'TXW29Zg3N8rR7Lq9n8rLkJH8zC41Q2K9mY',
    risk_tolerance_percent NUMERIC(5, 2) DEFAULT 2.00,
    has_completed_risk_quiz BOOLEAN DEFAULT TRUE,
    kyc_status TEXT DEFAULT 'VERIFIED' CHECK (kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BALANCES (Supports strict DEMO and REAL accounts)
CREATE TABLE IF NOT EXISTS public.balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL CHECK (account_type IN ('DEMO', 'REAL')),
    currency TEXT DEFAULT 'USDT',
    available_balance NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000,
    equity NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000,
    margin_used NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    free_margin NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000,
    margin_level_pct NUMERIC(10, 2) DEFAULT 9999.00,
    total_deposited NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, account_type)
);

-- 3. TRADES & POSITIONS
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL CHECK (account_type IN ('DEMO', 'REAL')),
    symbol TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('CRYPTO', 'FOREX')),
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    entry_price NUMERIC(18, 5) NOT NULL,
    exit_price NUMERIC(18, 5),
    current_price NUMERIC(18, 5) NOT NULL,
    size NUMERIC(18, 4) NOT NULL,
    leverage INT NOT NULL DEFAULT 10,
    margin NUMERIC(18, 4) NOT NULL,
    stop_loss NUMERIC(18, 5),
    take_profit NUMERIC(18, 5),
    liquidation_price NUMERIC(18, 5),
    pnl NUMERIC(18, 4) DEFAULT 0.0000,
    pips NUMERIC(10, 2) DEFAULT 0.00,
    rationale TEXT,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 4. DOUBLE-ENTRY AUDIT LEDGER
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL CHECK (account_type IN ('DEMO', 'REAL')),
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRADE_PROFIT', 'TRADE_LOSS', 'COMMISSION_FEE', 'DEMO_RESET', 'ADJUSTMENT', 'REFERRAL_BONUS')),
    amount NUMERIC(18, 4) NOT NULL,
    currency TEXT DEFAULT 'USDT',
    balance_after NUMERIC(18, 4) NOT NULL,
    tx_hash TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUANTITATIVE PREDICTIONS
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('CRYPTO', 'FOREX')),
    timeframe TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    confidence NUMERIC(5, 2) NOT NULL,
    entry_price NUMERIC(18, 5) NOT NULL,
    take_profit NUMERIC(18, 5) NOT NULL,
    stop_loss NUMERIC(18, 5) NOT NULL,
    risk_reward_ratio TEXT NOT NULL,
    win_rate_estimate TEXT NOT NULL,
    rsi_value NUMERIC(6, 2),
    macd_signal TEXT,
    ema_trend TEXT,
    rationale TEXT NOT NULL,
    is_admin_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REFERRALS
-- A referral is a relationship plus the reward it paid. Rewards are always
-- denominated in USD and always settle into the REAL balance.
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referrer_email TEXT NOT NULL,
    code TEXT NOT NULL,
    referred_email TEXT NOT NULL,
    referred_name TEXT,
    status TEXT NOT NULL DEFAULT 'QUALIFIED' CHECK (status IN ('PENDING', 'QUALIFIED')),
    reward_usd NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- One reward per referred email, ever. Enforced in the database so a
    -- replayed request cannot pay twice.
    UNIQUE(referrer_id, referred_email)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON public.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_ledger_user_created ON public.ledger_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON public.predictions(symbol, timeframe, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(code);

-- SEED INITIAL TRADER DEMO PROFILE IF NOT EXISTS
INSERT INTO public.profiles (id, email, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'trader@cryptohub.io', 'Alex Sterling', 'admin')
ON CONFLICT (email) DO NOTHING;

-- SEED DEMO AND REAL BALANCES
-- DEMO starts with the $10,000 virtual allocation. REAL starts unfunded at
-- $0.00: live capital exists only once a deposit is confirmed.
INSERT INTO public.balances (user_id, account_type, available_balance, equity, free_margin, total_deposited)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'DEMO', 10000.00, 10000.00, 10000.00, 10000.00),
  ('00000000-0000-0000-0000-000000000001', 'REAL', 0.00, 0.00, 0.00, 0.00)
ON CONFLICT (user_id, account_type) DO NOTHING;
