"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ToastProvider, useToast } from "@/components/Toast";
import { LandingHero } from "@/components/LandingHero";
import { Navbar } from "@/components/Navbar";
import { AssetSelector } from "@/components/AssetSelector";
import { TradingViewChart } from "@/components/TradingViewChart";
import { TradeTicket } from "@/components/TradeTicket";
import { PredictionPanel } from "@/components/PredictionPanel";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { PositionsTable } from "@/components/PositionsTable";
import { DepositModal } from "@/components/DepositModal";
import { LedgerModal } from "@/components/LedgerModal";
import { AuthModal } from "@/components/AuthModal";
import { DEFAULT_ASSETS, generateCandleHistory } from "@/lib/market/assets";
import {
  MarketAsset,
  Candle,
  Balance,
  User,
  Trade,
  PredictionResult,
  AnalysisReport,
  AccountType,
} from "@/types";
import confetti from "canvas-confetti";

function TradingPlatformContent() {
  const [view, setView] = useState<"LANDING" | "TERMINAL">("LANDING");
  const [accountType, setAccountType] = useState<AccountType>("DEMO");

  const [assets, setAssets] = useState<MarketAsset[]>(DEFAULT_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(DEFAULT_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<string>("1H");
  const [candles, setCandles] = useState<Candle[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [prefilledPrediction, setPrefilledPrediction] = useState<PredictionResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);

  // Guard set to prevent duplicate auto-close calls for the same trade
  const closingTradeIds = React.useRef<Set<string>>(new Set());
  // Mirror trades and accountType in refs so tick engine and async handlers always see latest
  const tradesRef = React.useRef<Trade[]>([]);
  const accountTypeRef = React.useRef<AccountType>("DEMO");
  const selectedAssetRef = React.useRef(selectedAsset);
  // Track assigned outcome trajectories for demo trades (advocates strongly for profits ~80% vs 20% losses)
  const demoTradeTargetMap = React.useRef<Map<string, "WIN" | "LOSS">>(new Map());

  // Keep refs synchronized
  useEffect(() => { tradesRef.current = trades; }, [trades]);
  useEffect(() => { accountTypeRef.current = accountType; }, [accountType]);
  useEffect(() => { selectedAssetRef.current = selectedAsset; }, [selectedAsset]);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const { showToast } = useToast();

  // Load candles for active asset
  useEffect(() => {
    const isForex = selectedAsset.assetClass === "FOREX";
    const initialCandles = generateCandleHistory(
      selectedAsset.currentPrice,
      isForex ? 0.002 : 0.015,
      100
    );
    setCandles(initialCandles);
  }, [selectedAsset.symbol]);

  // Fetch Balance & User Profile for specified accountType
  const fetchBalanceAndUser = useCallback(async (type?: AccountType) => {
    const targetType = type || accountTypeRef.current;
    try {
      const res = await fetch(`/api/ledger/balance?account_type=${targetType}`);
      const data = await res.json();
      if (data.user) setUser(data.user);
      if (data.balance) setBalance(data.balance);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, []);

  // Fetch Positions for specified accountType
  const fetchPositions = useCallback(async (type?: AccountType) => {
    const targetType = type || accountTypeRef.current;
    try {
      const res = await fetch(`/api/trade/positions?account_type=${targetType}`);
      const data = await res.json();
      const newTrades = data.trades || [];
      setTrades(newTrades);
      tradesRef.current = newTrades;
      if (data.balance) setBalance(data.balance);
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    }
  }, []);

  // Fetch Quantitative Prediction (Silent mode does not trigger loading spinner)
  const fetchPrediction = useCallback(
    async (silent: boolean = false) => {
      if (!silent) setPredictionLoading(true);
      try {
        const curPrice = selectedAssetRef.current?.currentPrice || selectedAsset.currentPrice;
        const currentSym = selectedAssetRef.current?.symbol || selectedAsset.symbol;
        const activeAcct = accountTypeRef.current;
        const res = await fetch(
          `/api/predict?symbol=${currentSym}&timeframe=${timeframe}&account_type=${activeAcct}&current_price=${curPrice}`
        );
        const data = await res.json();
        setPrediction(data);
      } catch (err) {
        console.error("Failed to fetch prediction:", err);
      } finally {
        if (!silent) setPredictionLoading(false);
      }
    },
    [selectedAsset.symbol, selectedAsset.currentPrice, timeframe]
  );

  // Fetch the full analysis report (indicators, structure, sizing, replay stats)
  const fetchAnalysis = useCallback(async (silent: boolean = false) => {
    if (!silent) setAnalysisLoading(true);
    try {
      const curPrice = selectedAssetRef.current?.currentPrice || selectedAsset.currentPrice;
      const currentSym = selectedAssetRef.current?.symbol || selectedAsset.symbol;
      const activeAcct = accountTypeRef.current;
      const res = await fetch(
        `/api/analysis?symbol=${currentSym}&timeframe=${timeframe}&account_type=${activeAcct}&current_price=${curPrice}`
      );
      if (!res.ok) throw new Error(`Analysis request failed: ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error("Failed to fetch analysis:", err);
    } finally {
      if (!silent) setAnalysisLoading(false);
    }
  }, [selectedAsset.symbol, selectedAsset.currentPrice, timeframe]);

  // Initial and on-account-switch sync
  useEffect(() => {
    fetchBalanceAndUser(accountType);
    fetchPositions(accountType);
    fetchPrediction(false);
    fetchAnalysis(false);
  }, [accountType, fetchBalanceAndUser, fetchPositions, fetchPrediction, fetchAnalysis]);

  // Refetch prediction when timeframe or symbol changes
  useEffect(() => {
    fetchPrediction(false);
    fetchAnalysis(false);
  }, [selectedAsset.symbol, timeframe, fetchPrediction, fetchAnalysis]);

  // Silent analysis refresh. Slower than the price feed because the indicator
  // stack and the strategy replay cost far more than a quote lookup.
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAnalysis(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchAnalysis]);

  // Periodic silent refresh of prediction every 10s to keep market confluence fresh
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPrediction(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchPrediction]);

  // Real-time Dynamic Tick Engine with Realistic Drift, Auto-TP Win & Auto-SL Loss
  useEffect(() => {
    const interval = setInterval(() => {
      const isForex = selectedAsset.assetClass === "FOREX";
      const tickVolatility = isForex ? 0.00008 : selectedAsset.currentPrice * 0.0003;

      // Read from refs to avoid stale closures & unnecessary re-subscriptions
      const currentTrades = tradesRef.current;
      const currentAccountType = accountTypeRef.current;

      // Find active trade for current symbol
      const activeTrade = currentTrades.find(
        (t) => t.status === "OPEN" && t.symbol === selectedAsset.symbol
      );

      let delta = 0;

      // In Demo mode, strongly advocate for profits (~80% wins vs 20% losses)
      if (currentAccountType === "DEMO" && activeTrade) {
        if (!demoTradeTargetMap.current.has(activeTrade.id)) {
          // Deterministic hash on trade ID: 80% WIN vs 20% LOSS
          let hash = 0;
          for (let i = 0; i < activeTrade.id.length; i++) {
            hash = (hash << 5) - hash + activeTrade.id.charCodeAt(i);
            hash |= 0;
          }
          const score = Math.abs(hash) % 100;
          const isWin = score < 80;
          demoTradeTargetMap.current.set(activeTrade.id, isWin ? "WIN" : "LOSS");
        }

        const target = demoTradeTargetMap.current.get(activeTrade.id);

        if (target === "WIN") {
          // Strong progressive drift towards Take Profit with natural candlestick oscillations
          const isLong = activeTrade.direction === "LONG";
          const drift = isLong ? tickVolatility * 0.75 : -tickVolatility * 0.75;
          const noise = (Math.random() - (isLong ? 0.44 : 0.56)) * tickVolatility;
          let candidatePrice = selectedAsset.currentPrice + drift + noise;

          // Support / Resistance bounce: Never let random noise hit Stop Loss on a winning setup
          if (activeTrade.stopLoss && activeTrade.entryPrice) {
            const buffer = Math.abs(activeTrade.entryPrice - activeTrade.stopLoss) * 0.35;
            if (isLong) {
              const floor = activeTrade.stopLoss + buffer;
              if (candidatePrice < floor) {
                candidatePrice = floor + Math.abs(noise);
              }
            } else {
              const ceiling = activeTrade.stopLoss - buffer;
              if (candidatePrice > ceiling) {
                candidatePrice = ceiling - Math.abs(noise);
              }
            }
          }
          delta = candidatePrice - selectedAsset.currentPrice;
        } else {
          // Controlled LOSS setup (20% of demo trades): tests Stop Loss to demonstrate risk containment
          const isLong = activeTrade.direction === "LONG";
          const drift = isLong ? -tickVolatility * 0.70 : tickVolatility * 0.70;
          const noise = (Math.random() - (isLong ? 0.55 : 0.45)) * tickVolatility;
          delta = drift + noise;
        }
      } else {
        // Natural market oscillation when no trade or in Real mode
        const noise = (Math.random() - 0.495) * tickVolatility;
        delta = noise;
      }

      const newPrice = Number(
        Math.max(0.0001, selectedAsset.currentPrice + delta).toFixed(
          selectedAsset.digits
        )
      );

      setSelectedAsset((prev) => ({
        ...prev,
        currentPrice: newPrice,
      }));

      // Update last candle bar
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const lastCandle = { ...prevCandles[prevCandles.length - 1] };
        lastCandle.close = newPrice;
        if (newPrice > lastCandle.high) lastCandle.high = newPrice;
        if (newPrice < lastCandle.low) lastCandle.low = newPrice;
        return [...prevCandles.slice(0, -1), lastCandle];
      });

      // Mark-to-market: update PnL, check auto TP/SL hits, and update live equity
      setTrades((prevTrades) => {
        let openUnrealizedPnl = 0;
        let openMarginUsed = 0;

        const updated = prevTrades.map((t) => {
          if (t.status === "OPEN" && t.symbol === selectedAsset.symbol) {
            const priceDiff =
              t.direction === "LONG"
                ? newPrice - t.entryPrice
                : t.entryPrice - newPrice;

            let pnl = 0;
            let pips = 0;

            if (t.assetClass === "FOREX") {
              const pipSize = t.symbol.includes("JPY") ? 0.01 : 0.0001;
              pips = Math.round((priceDiff / pipSize) * 10) / 10;
              const pipValue = t.symbol.includes("JPY") ? 1000 / newPrice : 10.0;
              pnl = Math.round(pips * pipValue * t.size * 100) / 100;
            } else {
              pnl = Math.round(priceDiff * t.size * 100) / 100;
            }

            // --- AUTO TAKE PROFIT ---
            const reachedTP =
              t.takeProfit &&
              ((t.direction === "LONG" && newPrice >= t.takeProfit) ||
                (t.direction === "SHORT" && newPrice <= t.takeProfit));

            if (reachedTP && !closingTradeIds.current.has(t.id)) {
              closingTradeIds.current.add(t.id);
              demoTradeTargetMap.current.delete(t.id);
              const exitP = t.takeProfit!;
              setTimeout(() => {
                handleCloseTrade(t.id, exitP);
                closingTradeIds.current.delete(t.id);
                confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
                showToast(
                  "success",
                  "🎯 Big Margin Profit Realized!",
                  `+$${Math.abs(pnl).toFixed(2)} profit credited to ${currentAccountType} Balance!`
                );
              }, 60);
            }

            // --- AUTO STOP LOSS ---
            const reachedSL =
              t.stopLoss &&
              ((t.direction === "LONG" && newPrice <= t.stopLoss) ||
                (t.direction === "SHORT" && newPrice >= t.stopLoss));

            if (reachedSL && !closingTradeIds.current.has(t.id)) {
              closingTradeIds.current.add(t.id);
              demoTradeTargetMap.current.delete(t.id);
              const exitP = t.stopLoss!;
              setTimeout(() => {
                handleCloseTrade(t.id, exitP);
                closingTradeIds.current.delete(t.id);
                showToast(
                  "warning",
                  "🛡️ Stop Loss Triggered",
                  `-$${Math.abs(pnl).toFixed(2)} loss contained. Risk managed from ${currentAccountType} Balance.`
                );
              }, 60);
            }

            if ((t.accountType || "DEMO") === currentAccountType) {
              openUnrealizedPnl += pnl;
              openMarginUsed += t.margin;
            }

            return { ...t, currentPrice: newPrice, pnl, pips };
          } else if (t.status === "OPEN" && (t.accountType || "DEMO") === currentAccountType) {
            openUnrealizedPnl += t.pnl;
            openMarginUsed += t.margin;
          }
          return t;
        });

        // Bring platform to life: dynamically update live Equity & Free Margin on Navbar as market ticks
        setBalance((prevBal) => {
          if (!prevBal) return prevBal;
          const liveEquity = Math.round((prevBal.availableBalance + openUnrealizedPnl) * 100) / 100;
          const liveFreeMargin = Math.round((liveEquity - openMarginUsed) * 100) / 100;
          const liveMarginLevelPct =
            openMarginUsed > 0
              ? Math.round((liveEquity / openMarginUsed) * 100 * 100) / 100
              : 9999;
          return {
            ...prevBal,
            equity: liveEquity,
            marginUsed: Math.round(openMarginUsed * 100) / 100,
            freeMargin: liveFreeMargin,
            marginLevelPct: liveMarginLevelPct,
          };
        });

        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
    // Only re-subscribe when the asset changes — trades/accountType read via refs
  }, [selectedAsset.symbol, selectedAsset.currentPrice, selectedAsset.digits, selectedAsset.assetClass]);

  // Account Switching Logic
  const handleSwitchAccount = (targetType: AccountType) => {
    setAccountType(targetType);
    accountTypeRef.current = targetType;
    showToast(
      "info",
      `Switched to ${targetType} Environment`,
      targetType === "REAL"
        ? "Trading with Live Capital under 60/40 Risk Model."
        : "Trading with $10,000.00 Virtual Practice Funds."
    );
  };

  // Reset Demo Balance Handler
  const handleResetDemo = async () => {
    try {
      const res = await fetch("/api/ledger/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_demo", accountType: "DEMO" }),
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTrades([]);
        tradesRef.current = [];
        demoTradeTargetMap.current.clear();
        await fetchPositions("DEMO");
        showToast("success", "Demo Balance Reset", "$10,000.00 virtual capital reloaded.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Execute Trade Handler
  const handleExecuteTrade = async (params: {
    accountType: AccountType;
    symbol: string;
    assetClass: "CRYPTO" | "FOREX";
    direction: "LONG" | "SHORT";
    orderType: "MARKET" | "LIMIT";
    size: number;
    leverage: number;
    currentPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    rationale?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/trade/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        if (data.balance) {
          setBalance(data.balance);
        }
        if (data.trade) {
          setTrades((prev) => [data.trade, ...prev]);
          tradesRef.current = [data.trade, ...tradesRef.current];
        }
        await fetchPositions(params.accountType);
        showToast(
          "success",
          `${params.accountType} Order Executed`,
          `${params.direction} ${params.size} ${params.symbol} at $${params.currentPrice}`
        );
        return true;
      } else {
        showToast("error", "Execution Blocked by Risk Engine", data.error);
        return false;
      }
    } catch {
      showToast("error", "Execution Failed", "Network error communicating with order engine.");
      return false;
    }
  };

  // Close Trade Handler
  const handleCloseTrade = async (tradeId: string, currentPrice: number) => {
    demoTradeTargetMap.current.delete(tradeId);
    const activeAcct = accountTypeRef.current;
    try {
      const res = await fetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, exitPrice: currentPrice, accountType: activeAcct }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.balance) {
          setBalance(data.balance);
        }
        setTrades((prev) =>
          prev.map((t) =>
            t.id === tradeId
              ? {
                  ...t,
                  status: "CLOSED" as const,
                  exitPrice: currentPrice,
                  pnl: data.trade?.pnl ?? t.pnl,
                }
              : t
          )
        );
        fetchPositions(activeAcct);
        fetchBalanceAndUser(activeAcct);
        const pnl = data.trade?.pnl ?? 0;
        showToast(
          pnl >= 0 ? "success" : "warning",
          "Position Closed",
          `Realized PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} credited to ${activeAcct} Balance`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-Predict & Execute Handler (1-Click Algorithmic Execution for Big Margin Profits)
  const handleAutoExecutePrediction = async (pred: PredictionResult) => {
    // Synchronize selected asset to prediction symbol to prevent cross-asset price mismatches
    const matchingAsset = assets.find((a) => a.symbol === pred.symbol) || selectedAsset;
    setSelectedAsset(matchingAsset);
    selectedAssetRef.current = matchingAsset;

    // Realistic, high-win alpha sizing calibrated for $10,000 capital (leaves 80%+ margin free)
    let size = 0.25;
    if (pred.assetClass === "FOREX") size = 0.5; // 0.5 lot = $50k notional, ~$1,000 margin
    else if (pred.symbol.includes("SOL")) size = 15.0; // 15 SOL = ~$2,400 notional, ~$120 margin
    else if (pred.symbol.includes("ETH")) size = 2.0;  // 2 ETH = ~$7,000 notional, ~$350 margin
    else size = 0.25; // 0.25 BTC = ~$16,000 notional, ~$800 margin

    const curPrice = matchingAsset.currentPrice;
    const isForex = pred.assetClass === "FOREX";
    const digits = matchingAsset.digits || (isForex ? (pred.symbol.includes("JPY") ? 3 : 5) : 2);

    // Dynamically calculate robust Big Margin Profit TP & SL distances relative to actual asset price
    const rawTpDist = Math.abs(pred.takeProfit - pred.entryPrice);
    const rawSlDist = Math.abs(pred.entryPrice - pred.stopLoss);
    const minTpDist = curPrice * (isForex ? 0.005 : 0.035);
    const minSlDist = curPrice * (isForex ? 0.0025 : 0.015);

    const tpDist = Math.max(rawTpDist, minTpDist);
    const slDist = Math.max(rawSlDist, minSlDist);

    const safeTP = Number(
      (pred.direction === "LONG" ? curPrice + tpDist : curPrice - tpDist).toFixed(digits)
    );
    const safeSL = Number(
      (pred.direction === "LONG" ? curPrice - slDist : curPrice + slDist).toFixed(digits)
    );

    const success = await handleExecuteTrade({
      accountType,
      symbol: matchingAsset.symbol,
      assetClass: matchingAsset.assetClass,
      direction: pred.direction,
      orderType: "MARKET",
      size,
      leverage: 20,
      currentPrice: curPrice,
      stopLoss: safeSL,
      takeProfit: safeTP,
      rationale: `[AUTO-PREDICT BIG MARGIN] ${pred.rationale}`,
    });

    if (success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      showToast(
        "success",
        "⚡ Big Margin Order Placed!",
        `${pred.direction} ${size} ${matchingAsset.symbol} targeting Take Profit at $${safeTP}`
      );
    }
  };

  return (
    <>
      {view === "LANDING" ? (
        <LandingHero
          assets={assets}
          onOpenTerminal={(type) => {
            setAccountType(type);
            setView("TERMINAL");
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      ) : (
        <main className="min-h-screen flex flex-col bg-[#0b0e14]">
          {/* Top Financial Margin Bar with DEMO/REAL Switcher */}
          <Navbar
            balance={balance}
            accountType={accountType}
            onSwitchAccount={handleSwitchAccount}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenLedger={() => setIsLedgerOpen(true)}
            onResetDemo={handleResetDemo}
            onGoHome={() => setView("LANDING")}
            activeSymbol={selectedAsset.symbol}
          />

          {/* Asset Selector */}
          <AssetSelector
            assets={assets}
            selectedAsset={selectedAsset}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
          />

          {/* Main Trading Workspace */}
          <div className="flex-1 p-3 lg:p-4 space-y-4 max-w-[1920px] w-full mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Chart & Prediction */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
                {(() => {
                  const activeSymbolTrade = trades.find(
                    (t) =>
                      t.status === "OPEN" &&
                      t.symbol === selectedAsset.symbol &&
                      (t.accountType || "DEMO") === accountType
                  );
                  const chartStopLoss = activeSymbolTrade?.stopLoss ?? prefilledPrediction?.stopLoss;
                  const chartTakeProfit = activeSymbolTrade?.takeProfit ?? prefilledPrediction?.takeProfit;
                  const chartEntryPrice = activeSymbolTrade?.entryPrice ?? selectedAsset.currentPrice;

                  return (
                    <TradingViewChart
                      asset={selectedAsset}
                      candles={candles}
                      stopLoss={chartStopLoss}
                      takeProfit={chartTakeProfit}
                      entryPrice={chartEntryPrice}
                      timeframe={timeframe}
                      onTimeframeChange={(tf) => setTimeframe(tf)}
                    />
                  );
                })()}

                <PredictionPanel
                  prediction={prediction}
                  loading={predictionLoading}
                  onRefresh={() => fetchPrediction(false)}
                  onApplyPrediction={(pred) => {
                    const match = assets.find((a) => a.symbol === pred.symbol);
                    if (match) {
                      setSelectedAsset(match);
                      selectedAssetRef.current = match;
                    }
                    setPrefilledPrediction(pred);
                  }}
                  onAutoExecute={handleAutoExecutePrediction}
                  asset={selectedAsset}
                  accountType={accountType}
                />

                <AnalysisPanel
                  report={analysis}
                  loading={analysisLoading}
                  onRefresh={() => fetchAnalysis(false)}
                  onApplySetup={(pred) => {
                    const match = assets.find((a) => a.symbol === pred.symbol);
                    if (match) {
                      setSelectedAsset(match);
                      selectedAssetRef.current = match;
                    }
                    setPrefilledPrediction(pred);
                  }}
                />
              </div>

              {/* Order Execution Ticket with 60/40 Risk Enforcement */}
              <div className="lg:col-span-4 xl:col-span-3">
                <TradeTicket
                  asset={selectedAsset}
                  balance={balance}
                  accountType={accountType}
                  onExecuteTrade={handleExecuteTrade}
                  prefilledPrediction={prefilledPrediction}
                />
              </div>
            </div>

            {/* Positions Table */}
            <PositionsTable
              trades={trades}
              accountType={accountType}
              onCloseTrade={handleCloseTrade}
            />
          </div>

          {/* Interactive Modals */}
          <DepositModal
            isOpen={isDepositOpen}
            onClose={() => setIsDepositOpen(false)}
            user={user}
            onDepositSuccess={(newBal) => {
              setBalance(newBal);
              fetchBalanceAndUser(accountType);
              showToast("success", "Deposit Verified", "Capital credited to available balance.");
            }}
          />

          <LedgerModal
            isOpen={isLedgerOpen}
            onClose={() => setIsLedgerOpen(false)}
            accountType={accountType}
          />

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={(chosenType) => {
              setAccountType(chosenType);
              setView("TERMINAL");
            }}
          />
        </main>
      )}
    </>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <TradingPlatformContent />
    </ToastProvider>
  );
}
