"use client";

import React from "react";
import { Balance, AccountType } from "@/types";
import {
  Wallet,
  ArrowDownToLine,
  FileText,
  Activity,
  RotateCcw,
  Home,
  ShieldCheck,
} from "lucide-react";

interface NavbarProps {
  balance: Balance | null;
  accountType: AccountType;
  onSwitchAccount: (type: AccountType) => void;
  onOpenDeposit: () => void;
  onOpenLedger: () => void;
  onResetDemo: () => void;
  onGoHome: () => void;
  activeSymbol: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  balance,
  accountType,
  onSwitchAccount,
  onOpenDeposit,
  onOpenLedger,
  onResetDemo,
  onGoHome,
  activeSymbol,
}) => {
  const equity = balance?.equity ?? (accountType === "DEMO" ? 10000 : 10000);
  const available = balance?.availableBalance ?? (accountType === "DEMO" ? 10000 : 10000);
  const marginUsed = balance?.marginUsed ?? 0;
  const freeMargin = balance?.freeMargin ?? available;
  const marginLevel = balance?.marginLevelPct ?? 0;

  // Baseline is always $10,000 (both DEMO and REAL initial deposit)
  const BASELINE = 10000;
  const balanceDelta = available - BASELINE;

  const isDemo = accountType === "DEMO";

  return (
    <header className="border-b border-border bg-[#0d121c]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Logo, Mode Badge & Symbol Status */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onGoHome}
              title="Return to Public Landing Page"
              className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-lg tracking-wider hover:opacity-90 transition-opacity"
            >
              CH
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Crypto<span className="text-cyan-400">Hub</span>
                </span>
                {/* Visual Account Badge */}
                <span
                  className={`px-2 py-0.5 text-[10px] font-black tracking-widest uppercase rounded border ${
                    isDemo
                      ? "bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm shadow-cyan-900/50"
                      : "bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm shadow-emerald-900/50 animate-pulse-fast"
                  }`}
                >
                  {isDemo ? "DEMO • VIRTUAL" : "REAL • LIVE CAPITAL"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Feed Online</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">{activeSymbol}</span>
              </div>
            </div>
          </div>

          {/* Account Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSwitchAccount("DEMO")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                isDemo
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              DEMO
            </button>
            <button
              onClick={() => onSwitchAccount("REAL")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                !isDemo
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              REAL
            </button>
          </div>
        </div>

        {/* Live Financial Margin Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 w-full lg:w-auto justify-around lg:justify-start shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-cyan-400" />
              {isDemo ? "Virtual Balance" : "Real Available"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                ${available.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {Math.abs(balanceDelta) > 0.01 && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                    balanceDelta >= 0
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  }`}
                >
                  {balanceDelta >= 0 ? "+" : "-"}${Math.abs(balanceDelta).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Equity
            </span>
            <span
              className={`text-sm sm:text-base font-bold tracking-tight ${
                equity >= available ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Margin Used
            </span>
            <span className="text-sm font-semibold text-slate-200">
              ${marginUsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Free Margin
            </span>
            <span className="text-sm font-semibold text-cyan-400">
              ${freeMargin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          <div className="flex flex-col hidden md:flex">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Margin Level
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              {marginLevel > 2000 ? ">2000%" : `${marginLevel.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          {isDemo ? (
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              title="Reset Demo Account Virtual Balance to $10,000.00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ($10k)
            </button>
          ) : (
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-lg text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Deposit Capital
            </button>
          )}

          <button
            onClick={onOpenLedger}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            title={`View ${accountType} Audit Ledger`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Ledger
          </button>

          <button
            onClick={onGoHome}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-1.5 rounded-lg text-xs transition-all"
            title="Return to Public Landing Page"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
