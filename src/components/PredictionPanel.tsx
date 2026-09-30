"use client";

import React, { useState } from "react";
import { PredictionResult, MarketAsset, BacktestSetup, AccountType } from "@/types";
import { HISTORICAL_BACKTEST_SETUPS } from "@/lib/indicators/backtest";
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Target,
  ShieldCheck,
  Zap,
  History,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

interface PredictionPanelProps {
  prediction: PredictionResult | null;
  loading: boolean;
  onRefresh: () => void;
  onApplyPrediction: (pred: PredictionResult) => void;
  onAutoExecute?: (pred: PredictionResult) => void;
  asset: MarketAsset;
  accountType: AccountType;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  prediction,
  loading,
  onRefresh,
  onApplyPrediction,
  onAutoExecute,
  asset,
  accountType,
}) => {
  const [activeTab, setActiveTab] = useState<"LIVE" | "BACKTEST">("LIVE");
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestSetup>(
    HISTORICAL_BACKTEST_SETUPS[0]
  );
  const [applied, setApplied] = useState(false);
  const [autoExecuting, setAutoExecuting] = useState(false);

  const getEffectivePrediction = (): PredictionResult | null => {
    if (activeTab === "LIVE") return prediction;
    return {
      id: selectedBacktest.id,
      symbol: selectedBacktest.symbol,
      assetClass: selectedBacktest.assetClass,
      timeframe: "4H",
      direction: selectedBacktest.direction,
      confidence: 85,
      entryPrice: selectedBacktest.entryPrice,
      takeProfit: selectedBacktest.takeProfit,
      stopLoss: selectedBacktest.stopLoss,
      riskRewardRatio: "1:2.2",
      winRateEstimate: selectedBacktest.strategyWinRate,
      indicators: {
        rsi: 32,
        rsiSignal: "OVERSOLD",
        macd: { macdLine: 12, signalLine: 8, histogram: 4, cross: "BULLISH_CROSS" },
        ema50: selectedBacktest.entryPrice * 0.98,
        ema200: selectedBacktest.entryPrice * 0.95,
        emaTrend: "GOLDEN_ALIGNMENT",
      },
      rationale: selectedBacktest.rationale,
      isBacktest: true,
      createdAt: new Date().toISOString(),
    };
  };

  const handleApply = () => {
    const pred = getEffectivePrediction();
    if (!pred) return;
    onApplyPrediction(pred);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleInstantAutoExecute = async () => {
    const pred = getEffectivePrediction();
    if (!pred || !onAutoExecute) return;
    setAutoExecuting(true);
    await onAutoExecute(pred);
    setAutoExecuting(false);
  };

  const isLong =
    activeTab === "LIVE"
      ? prediction?.direction === "LONG"
      : selectedBacktest.direction === "LONG";

  return (
    <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-4 shadow-xl relative overflow-hidden">
      {/* Glow Top Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isLong
            ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
            : "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500"
        }`}
      />

      {/* Header with Dual Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-wide">
                QUANT PREDICTION ENGINE
              </h3>
              {accountType === "DEMO" ? (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  DEMO • HIGH WIN ALPHA (~78%)
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-700/80 flex items-center gap-1">
                  REAL • 60/40 RISK MODEL
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {activeTab === "LIVE"
                ? "Algorithmic Technical Signal Pipeline"
                : "Historical Strategy Replay & Backtest Verification"}
            </p>
          </div>
        </div>

        {/* Tab switcher: Live vs Backtest */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("LIVE")}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === "LIVE"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Live Quant Signal
          </button>
          <button
            onClick={() => setActiveTab("BACKTEST")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === "BACKTEST"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Backtest Replay
          </button>

          {activeTab === "LIVE" && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-slate-400 hover:text-cyan-400 p-1 rounded hover:bg-slate-800"
              title="Refresh Live Signals"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {activeTab === "BACKTEST" ? (
        /* BACKTEST / HISTORICAL REPLAY MODE */
        <div className="space-y-3">
          <div className="bg-indigo-950/40 border border-indigo-800/40 p-2.5 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-indigo-200 text-[11px]">
                <strong>Educational Backtest Mode:</strong> Select historical setups to inspect past quantitative indicator conditions and proven outcomes.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
              Not Live Prediction
            </span>
          </div>

          {/* Setup Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HISTORICAL_BACKTEST_SETUPS.map((setup) => (
              <button
                key={setup.id}
                onClick={() => setSelectedBacktest(setup)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedBacktest.id === setup.id
                    ? "bg-indigo-950/80 border-cyan-400 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                }`}
              >
                <div className="flex justify-between text-[10px] font-bold">
                  <span>{setup.symbol}</span>
                  <span className="text-emerald-400">WIN</span>
                </div>
                <div className="text-[11px] font-semibold truncate text-slate-200 mt-0.5">
                  {setup.title}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">{setup.date}</div>
              </button>
            ))}
          </div>

          {/* Detailed Selected Backtest Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Past Strategy Setup</span>
              <div className="text-sm font-bold text-white mt-1">{selectedBacktest.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Date: {selectedBacktest.date}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                Strategy Win Rate: {selectedBacktest.strategyWinRate}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Historical Blueprint</span>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry:</span>
                  <span className="font-bold text-white">${selectedBacktest.entryPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">Target (TP):</span>
                  <span className="font-bold text-emerald-400">${selectedBacktest.takeProfit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">Stop (SL):</span>
                  <span className="font-bold text-rose-400">${selectedBacktest.stopLoss}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Outcome & Compliance</span>
              <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Target Reached (+{selectedBacktest.pnlPercent}%)
              </div>
              <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                {selectedBacktest.disclaimer}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* LIVE QUANT PREDICTION MODE */
        prediction && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Direction & Confidence */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Model Direction
              </span>
              <div className="flex items-center justify-between my-1">
                <div
                  className={`flex items-center gap-1.5 font-black text-xl tracking-tight ${
                    isLong ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isLong ? (
                    <ArrowUpRight className="w-6 h-6 stroke-[3]" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 stroke-[3]" />
                  )}
                  <span>{prediction.direction}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Target Win Rate</span>
                  <span className="text-xs font-bold text-emerald-400">{prediction.winRateEstimate}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    Confidence
                  </span>
                  <span className="text-cyan-400 font-bold">{prediction.confidence}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLong
                        ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                        : "bg-gradient-to-r from-amber-500 to-rose-500"
                    }`}
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Setup Parameters */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Setup Parameters
                </span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                  R:R {prediction.riskRewardRatio}
                </span>
              </div>

              <div className="space-y-1.5 my-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Entry
                  </span>
                  <span className="font-bold text-white">${prediction.entryPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Take Profit (TP)
                  </span>
                  <span className="font-bold text-emerald-400">${prediction.takeProfit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Stop Loss (SL)
                  </span>
                  <span className="font-bold text-rose-400">${prediction.stopLoss}</span>
                </div>
              </div>
            </div>

            {/* Indicators Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Indicator Metrics
              </span>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RSI (14):</span>
                  <span className="font-semibold text-slate-200">
                    {prediction.indicators.rsi} ({prediction.indicators.rsiSignal})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MACD Cross:</span>
                  <span className="font-semibold text-emerald-400">
                    {prediction.indicators.macd.cross.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EMA Trend:</span>
                  <span className="font-semibold text-cyan-400">
                    {prediction.indicators.emaTrend.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Rationale and Execute Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 mt-3">
        <p className="text-[11px] text-slate-300 flex-1 leading-relaxed">
          <span className="font-bold text-cyan-400">Strategy Rationale: </span>
          {activeTab === "LIVE" ? prediction?.rationale : selectedBacktest.rationale}
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Instant Auto-Execute One-Click Button */}
          {onAutoExecute && (
            <button
              onClick={handleInstantAutoExecute}
              disabled={autoExecuting || loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-4 py-2 rounded-lg text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/25 active:scale-95 whitespace-nowrap"
              title="1-Click: Generates and immediately executes trade into Demo positions"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              {autoExecuting ? "Executing..." : "Auto-Predict & Execute"}
            </button>
          )}

          {/* Auto-Fill Button */}
          <button
            onClick={handleApply}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 font-bold px-3 py-2 rounded-lg text-xs tracking-wide transition-all shadow-md active:scale-95 border whitespace-nowrap ${
              applied
                ? "bg-slate-800 border-emerald-500 text-emerald-400"
                : "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200"
            }`}
          >
            {applied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Auto-Filled!
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Fill Ticket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
