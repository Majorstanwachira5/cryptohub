"use client";

import React, { useState } from "react";
import {
  Balance,
  User,
  Trade,
  ReferralStats,
  MarketAsset,
  AccountType,
  ProfileSummary,
} from "@/types";
import { DisplayCurrency, formatMoney, formatSignedMoney } from "@/lib/fx/rates";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Gift,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  ArrowDownToLine,
  Check,
  Copy,
  Clock,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface HomeDashboardProps {
  user: User | null;
  balance: Balance | null;
  profile: ProfileSummary | null;
  referrals: ReferralStats | null;
  trades: Trade[];
  assets: MarketAsset[];
  accountType: AccountType;
  currency: DisplayCurrency;
  onNavigateToTrade: (accountType?: AccountType, asset?: MarketAsset) => void;
  onNavigateToReferrals: () => void;
  onNavigateToMike: () => void;
  onOpenDeposit: () => void;
  onResetDemo: () => void;
  onCloseTrade: (tradeId: string, exitPrice: number) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  balance,
  profile,
  referrals,
  trades,
  assets,
  accountType,
  currency,
  onNavigateToTrade,
  onNavigateToReferrals,
  onNavigateToMike,
  onOpenDeposit,
  onResetDemo,
  onCloseTrade,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  // Derive account figures from backend data
  const isDemo = accountType === "DEMO";
  const demoBal = profile?.demo ?? (isDemo ? balance : null);
  const realBal = profile?.real ?? (!isDemo ? balance : null);

  const demoAvailable = demoBal?.availableBalance ?? 10000;
  const demoEquity = demoBal?.equity ?? 10000;
  const realAvailable = realBal?.availableBalance ?? 0;
  const realEquity = realBal?.equity ?? 0;
  const realDeposited = realBal?.totalDeposited ?? 0;

  // Active trades for currently selected account
  const activeTrades = trades.filter(
    (t) => t.status === "OPEN" && (t.accountType || "DEMO") === accountType
  );
  const closedTrades = trades.filter(
    (t) => t.status === "CLOSED" && (t.accountType || "DEMO") === accountType
  );

  const totalClosed = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => t.pnl > 0).length;
  const winRate = totalClosed > 0 ? (winningTrades / totalClosed) * 100 : 0;
  const netRealizedPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);

  const copyReferralCode = async () => {
    if (!referrals?.code) return;
    try {
      await navigator.clipboard.writeText(referrals.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. Welcome & Account Greeting Card */}
      <div className="bg-gradient-to-r from-[#101726] via-[#121c2e] to-[#0c111c] border border-cyan-500/20 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Institutional Trading Engine Online
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome back, <span className="text-cyan-400">{user?.name || "Trader"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Quantitative risk enforcement active. Monitor your portfolio and execute orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1.5 shadow">
              <ShieldCheck className="w-3.5 h-3.5" />
              KYC {user?.kycStatus || "VERIFIED"}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
              Role: {user?.role || "Trader"}
            </span>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => onNavigateToTrade("DEMO")}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-cyan-500/20"
          >
            <span>Practice Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateToTrade("REAL")}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <span>Trade Live Real</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 border border-slate-700"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deposit Capital</span>
          </button>
          <button
            onClick={onNavigateToMike}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/70 hover:to-purple-800/70 text-cyan-300 font-bold py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 border border-indigo-700/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Mike AI</span>
          </button>
        </div>
      </div>

      {/* 2. Account Balances Grid (Demo & Real Side-by-Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Demo Account Balance Card */}
        <div className="bg-[#111724] border border-cyan-900/40 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-lg transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">DEMO ACCOUNT</h3>
                <span className="text-[10px] uppercase font-bold text-cyan-400">Virtual Funds</span>
              </div>
            </div>
            <button
              onClick={onResetDemo}
              title="Reset Virtual Demo Capital to $10,000.00"
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2 py-1 rounded-md text-[10px] font-bold transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Reset ($10k)
            </button>
          </div>

          <div className="mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Available Practice Balance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatMoney(demoAvailable, currency)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Equity</span>
              <span className="font-bold text-slate-200">{formatMoney(demoEquity, currency)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Free Margin</span>
              <span className="font-bold text-cyan-400">
                {formatMoney(demoBal?.freeMargin ?? demoAvailable, currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Margin Used</span>
              <span className="font-bold text-slate-200">
                {formatMoney(demoBal?.marginUsed ?? 0, currency)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTrade("DEMO")}
            className="w-full mt-4 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Open Demo Trading Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Account Balance Card */}
        <div className="bg-[#111724] border border-emerald-900/40 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">REAL ACCOUNT</h3>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Live Capital</span>
              </div>
            </div>
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-md text-[10px] font-black transition-all shadow"
            >
              <ArrowDownToLine className="w-3 h-3" />
              Deposit
            </button>
          </div>

          <div className="mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Live Available Capital
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatMoney(realAvailable, currency)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Equity</span>
              <span className="font-bold text-emerald-400">{formatMoney(realEquity, currency)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Deposited</span>
              <span className="font-bold text-slate-200">
                {formatMoney(realDeposited, currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Free Margin</span>
              <span className="font-bold text-slate-200">
                {formatMoney(realBal?.freeMargin ?? realAvailable, currency)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTrade("REAL")}
            className="w-full mt-4 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Open Real Trading Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Live Market Ticker Grid */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider">
              Live Market Tickers
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Tap any instrument to trade</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {assets.map((asset) => {
            const isPositive = asset.change24h >= 0;
            return (
              <button
                key={asset.symbol}
                onClick={() => onNavigateToTrade(accountType, asset)}
                className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl text-left transition-all active:scale-95 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-white group-hover:text-cyan-400 transition-colors">
                    {asset.symbol}
                  </span>
                  <span className="text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-400">
                    {asset.assetClass}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  ${asset.currentPrice.toLocaleString("en-US", {
                    minimumFractionDigits: asset.digits,
                    maximumFractionDigits: asset.digits,
                  })}
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center mt-0.5 ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {asset.change24h.toFixed(2)}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Trading Positions & Realised Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active Positions Card */}
        <div className="lg:col-span-7 bg-[#111724] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider">
                  Open Positions ({accountType})
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTrade(accountType)}
                className="text-xs text-cyan-400 hover:underline font-bold"
              >
                Manage All
              </button>
            </div>

            {activeTrades.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                <Layers className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No open positions on {accountType} account.</p>
                <button
                  onClick={() => onNavigateToTrade(accountType)}
                  className="mt-3 inline-flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  <span>Open New Trade</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTrades.slice(0, 3).map((trade) => {
                  const isLong = trade.direction === "LONG";
                  const isProfit = trade.pnl >= 0;
                  return (
                    <div
                      key={trade.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            isLong
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : "bg-rose-950 text-rose-400 border-rose-800"
                          }`}
                        >
                          {trade.direction}
                        </span>
                        <div>
                          <div className="font-extrabold text-xs text-white">{trade.symbol}</div>
                          <div className="text-[10px] text-slate-500">
                            {trade.size} @ ${trade.entryPrice}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-black text-xs ${
                            isProfit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatSignedMoney(trade.pnl, currency)}
                        </div>
                        <button
                          onClick={() => onCloseTrade(trade.id, trade.currentPrice)}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Close Position
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {activeTrades.length > 3 && (
            <div className="mt-3 text-center text-xs text-slate-400">
              +{activeTrades.length - 3} more open position(s) in Trade terminal.
            </div>
          )}
        </div>

        {/* Realised Performance Card */}
        <div className="lg:col-span-5 bg-[#111724] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider">
                Trading Record ({accountType})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[9px] uppercase font-bold text-slate-500">Win Rate</span>
              <div
                className={`text-xl font-black mt-0.5 ${
                  winRate >= 50 ? "text-emerald-400" : "text-slate-300"
                }`}
              >
                {totalClosed > 0 ? `${winRate.toFixed(1)}%` : "—"}
              </div>
              <span className="text-[10px] text-slate-500">
                {winningTrades} wins / {totalClosed - winningTrades} losses
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[9px] uppercase font-bold text-slate-500">Realised PnL</span>
              <div
                className={`text-xl font-black mt-0.5 ${
                  netRealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatSignedMoney(netRealizedPnl, currency)}
              </div>
              <span className="text-[10px] text-slate-500">Total {totalClosed} closed</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Risk Management Model:</span>
              <span className="font-bold text-white">60/40 Confluence</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Min Required Reward:Risk:</span>
              <span className="font-bold text-cyan-400">1:1.5</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Max Capital Risk Per Trade:</span>
              <span className="font-bold text-slate-200">2.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Referral Overview & 60/40 Risk Model Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Referral Program Overview Card */}
        <div className="bg-[#111724] border border-amber-900/40 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">REFERRAL PROGRAM</h3>
                <span className="text-[10px] font-bold text-amber-400">
                  $5.00 USD Real Reward Per Referral
                </span>
              </div>
            </div>
            <button
              onClick={onNavigateToReferrals}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              View Program
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[9px] uppercase font-bold text-slate-500">Total Referrals</span>
              <div className="text-lg font-black text-white">{referrals?.totalReferrals ?? 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[9px] uppercase font-bold text-slate-500">Earned Real USD</span>
              <div className="text-lg font-black text-emerald-400">
                ${(referrals?.totalEarnedUsd ?? 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
            <div className="flex-1 font-mono text-center font-black tracking-widest text-cyan-400 text-sm">
              {referrals?.code || "------"}
            </div>
            <button
              onClick={copyReferralCode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* 60/40 Quantitative Risk Model Card */}
        <div className="bg-[#111724] border border-cyan-900/40 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-lg transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">60/40 RISK GOVERNANCE</h3>
              <span className="text-[10px] font-bold text-cyan-400">Automated Protection Rules</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            CryptoHub enforces a probabilistic risk model to protect trader capital against liquidation.
            All live trades require:
          </p>

          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Mandatory Stop Loss on all live positions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Minimum 1:1.5 Reward-to-Risk ratio</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Position risk strictly capped at 2.0% of balance</span>
            </li>
          </ul>

          <div className="mt-3 text-[10px] text-slate-500 italic">
            Note: Probabilistic models guide risk sizing. Market outcomes carry inherent variance.
          </div>
        </div>
      </div>
    </div>
  );
};
