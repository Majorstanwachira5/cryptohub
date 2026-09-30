"use client";

import React from "react";
import { MarketAsset } from "@/types";
import {
  ShieldCheck,
  TrendingUp,
  Cpu,
  ArrowRight,
  Layers,
  Lock,
  Zap,
  BarChart2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";

interface LandingHeroProps {
  assets: MarketAsset[];
  onOpenTerminal: (accountType: "DEMO" | "REAL") => void;
  onOpenAuth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  assets,
  onOpenTerminal,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* 1. Landing Navigation */}
      <nav className="border-b border-slate-800/80 bg-[#0d121c]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-lg">
              CH
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">
                Crypto<span className="text-cyan-400">Hub</span>
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Institutional Quant
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-semibold">
            <a href="#demo-vs-real" className="hover:text-white transition-colors">
              Demo vs. Real
            </a>
            <a href="#strategy" className="hover:text-white transition-colors">
              60/40 Risk Model
            </a>
            <a href="#prediction" className="hover:text-white transition-colors">
              Quant Prediction
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenTerminal("DEMO")}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow"
            >
              Demo ($10k)
            </button>
            <button
              onClick={() => onOpenTerminal("REAL")}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold px-4 py-1.5 rounded-lg text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Enter Real Terminal
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Live Market Ticker Tape */}
      <div className="border-b border-slate-800/80 bg-[#0a0f1a] py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 text-xs whitespace-nowrap">
          <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Tickers:
          </span>
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center gap-2">
              <span className="font-bold text-slate-300">{asset.symbol}</span>
              <span className="font-semibold text-white">
                ${asset.currentPrice.toLocaleString("en-US", {
                  minimumFractionDigits: asset.digits,
                  maximumFractionDigits: asset.digits,
                })}
              </span>
              <span
                className={`text-[11px] font-bold flex items-center ${
                  asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {asset.change24h >= 0 ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold mb-6 shadow-lg shadow-cyan-950/50">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Transparent Quantitative Trading Architecture
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
          Algorithmic Precision for{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Crypto & Forex
          </span>{" "}
          Markets
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Master the markets with realistic virtual practice or trade live capital under a mathematically proven{" "}
          <strong className="text-slate-200">60% Win / 40% Risk Model</strong> with institutional execution and mandatory Stop Loss protection.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={() => onOpenTerminal("DEMO")}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-sm shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
          >
            Launch Free Demo ($10,000 USD)
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenTerminal("REAL")}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700 px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Trade Real Account (60/40 Risk)
          </button>
        </div>
      </section>

      {/* 4. Demo vs Real Separation Showcase */}
      <section id="demo-vs-real" className="px-6 py-16 bg-[#0a0f1b] border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
              Account Isolation Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Two Distinct Environments. Zero Compromise.
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
              We never hardcode results or mix demo trades with real money. Realism builds genuine trading edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DEMO Card */}
            <div className="bg-gradient-to-b from-indigo-950/40 to-[#0d1322] border border-cyan-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[11px] font-black uppercase tracking-wider">
                  DEMO — Virtual Capital
                </span>
                <span className="text-xl font-black text-white">$10,000.00</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Education & Strategy Backtesting</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Test setups with real-time market data, realistic spreads, slippage, and swap fees. Explore historical replay setups to study high-probability patterns.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  $10,000.00 Instant Virtual Balance (Reset anytime)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Educational Historical Replay & Backtest Mode
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Direct 1-click execution for simulated testing
                </li>
              </ul>

              <button
                onClick={() => onOpenTerminal("DEMO")}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all"
              >
                Open Demo Terminal
              </button>
            </div>

            {/* REAL Card */}
            <div className="bg-gradient-to-b from-emerald-950/30 to-[#0d1322] border border-emerald-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
                  REAL — Live Funds
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 60/40 Risk Guard
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Institutional Live Trading</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Trade with real capital governed by mathematical risk parameters. Every trade requires mandatory Stop Loss protection and position sizing capped at 2% balance risk.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mandatory Stop Loss prevents portfolio drawdowns
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Max 2.0% balance risk per trade strictly enforced
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Minimum 1:1.5 Reward-to-Risk ratio required
                </li>
              </ul>

              <button
                onClick={() => onOpenTerminal("REAL")}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                Enter Real Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Mathematical Edge (60/40 Model) */}
      <section id="strategy" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="bg-[#101726] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Quantitative Economics
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                The 60% Win / 40% Risk Mathematical Model
              </h2>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Amateur traders blow accounts by losing 100% on a few bad trades. Our engine treats market losses as a calculated cost of doing business. By restricting losses to 1 unit with mandatory Stop Loss and capturing $\ge 2$ units on 60% wins:
              </p>

              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                <div className="text-cyan-400 font-bold mb-1">Expected Return per 10 Trades:</div>
                <div className="text-emerald-400 font-semibold">+ 6 Wins × $200 Reward = +$1,200</div>
                <div className="text-rose-400 font-semibold">- 4 Losses × $100 Risk = -$400</div>
                <div className="text-white font-bold border-t border-slate-700 pt-1 mt-1">
                  Net Realized Alpha = +$800 (+8.0% ROI)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <div className="text-3xl font-black text-emerald-400">60%</div>
                <div className="text-xs font-bold text-white mt-1">Target Win Rate</div>
                <div className="text-[10px] text-slate-500 mt-1">Algorithmic technical edge</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <div className="text-3xl font-black text-cyan-400">1 : 2.0</div>
                <div className="text-xs font-bold text-white mt-1">Reward to Risk</div>
                <div className="text-[10px] text-slate-500 mt-1">Enforced minimum 1:1.5</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <div className="text-3xl font-black text-amber-400">2.0%</div>
                <div className="text-xs font-bold text-white mt-1">Max Balance Risk</div>
                <div className="text-[10px] text-slate-500 mt-1">Per trade capital cap</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
                <div className="text-3xl font-black text-indigo-400">100%</div>
                <div className="text-xs font-bold text-white mt-1">Mandatory SL</div>
                <div className="text-[10px] text-slate-500 mt-1">Zero naked positions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e18] py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 CryptoHub Quantitative Institutional Terminal. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Trading cryptocurrencies and foreign exchange involves substantial risk of loss. Virtual demo practice does not guarantee live market profits.
        </p>
      </footer>
    </div>
  );
};
