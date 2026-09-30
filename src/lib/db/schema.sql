-- ============================================================================
-- CRYPTOHUB INSTITUTIONAL TRADING PLATFORM - POSTGRESQL SCHEMA
-- Supports Crypto & Forex Markets, Double-Entry Ledgers, Risk Engine & Predictions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & WALLET PROFILES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    btc_deposit_address VARCHAR(100) NOT NULL,
    eth_deposit_address VARCHAR(100) NOT NULL,
    usdt_trc20_address VARCHAR(100) NOT NULL,
    risk_tolerance_percent NUMERIC(5, 2) DEFAULT 2.00, -- 2% default risk per trade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FINANCIAL BALANCES & MARGIN MONITORING
CREATE TABLE IF NOT EXISTS balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'USDT',
    available_balance NUMERIC(18, 4) NOT NULL DEFAULT 25000.0000,
    equity NUMERIC(18, 4) NOT NULL DEFAULT 25000.0000,
    margin_used NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    free_margin NUMERIC(18, 4) NOT NULL DEFAULT 25000.0000,
    margin_level_pct NUMERIC(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRADES & POSITIONS
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL, -- e.g. BTCUSDT, EURUSD
    asset_class VARCHAR(10) NOT NULL CHECK (asset_class IN ('CRYPTO', 'FOREX')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    entry_price NUMERIC(18, 5) NOT NULL,
    exit_price NUMERIC(18, 5),
    current_price NUMERIC(18, 5) NOT NULL,
    size NUMERIC(18, 4) NOT NULL, -- Units for Crypto, Lots for Forex
    leverage INT NOT NULL DEFAULT 10,
    margin NUMERIC(18, 4) NOT NULL,
    stop_loss NUMERIC(18, 5),
    take_profit NUMERIC(18, 5),
    liquidation_price NUMERIC(18, 5),
    pnl NUMERIC(18, 4) DEFAULT 0.0000,
    pips NUMERIC(10, 2) DEFAULT 0.00,
    rationale TEXT,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 4. DOUBLE-ENTRY AUDIT LEDGER
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRADE_PROFIT', 'TRADE_LOSS', 'COMMISSION_FEE', 'ADJUSTMENT')),
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDT',
    balance_after NUMERIC(18, 4) NOT NULL,
    tx_hash VARCHAR(120),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. QUANTITATIVE PREDICTIONS
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    asset_class VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL, -- 1H, 4H, 1D
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    confidence NUMERIC(5, 2) NOT NULL, -- e.g. 84.50%
    entry_price NUMERIC(18, 5) NOT NULL,
    take_profit NUMERIC(18, 5) NOT NULL,
    stop_loss NUMERIC(18, 5) NOT NULL,
    risk_reward_ratio VARCHAR(20) NOT NULL,
    win_rate_estimate VARCHAR(20) NOT NULL,
    rsi_value NUMERIC(6, 2),
    macd_signal VARCHAR(50),
    ema_trend VARCHAR(50),
    rationale TEXT NOT NULL,
    is_admin_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-THROUGHPUT RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_ledger_user_created ON ledger_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_symbol_tf ON predictions(symbol, timeframe, created_at DESC);
