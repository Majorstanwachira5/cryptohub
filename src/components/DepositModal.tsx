"use client";

import React, { useState } from "react";
import { User, Balance } from "@/types";
import {
  X,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onDepositSuccess: (newBalance: Balance) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  user,
  onDepositSuccess,
}) => {
  const [method, setMethod] = useState<"CRYPTO" | "FIAT">("CRYPTO");
  const [cryptoAsset, setCryptoAsset] = useState<"USDT" | "BTC" | "ETH">("USDT");
  const [fiatAmount, setFiatAmount] = useState<string>("5000");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const getAddress = () => {
    if (cryptoAsset === "BTC") return user?.btcAddress || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    if (cryptoAsset === "ETH") return user?.ethAddress || "0x71C8407BEA758B540306E5D73A9dFcf38914A690";
    return user?.usdtAddress || "TXW29Zg3N8rR7Lq9n8rLkJH8zC41Q2K9mY";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getAddress());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteDeposit = async (amount: number, depositType: string) => {
    setLoading(true);
    setSuccessNotice(null);

    try {
      const res = await fetch("/api/ledger/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: depositType,
          txHash: `0x${Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join("")}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setSuccessNotice(`Successfully credited $${amount.toLocaleString()} USDT to your account!`);
        onDepositSuccess(data.balance);
        setTimeout(() => {
          setSuccessNotice(null);
          onClose();
        }, 2500);
      }
    } catch {
      alert("Failed to process deposit simulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e1320]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Deposit Capital</h3>
              <p className="text-xs text-slate-400">Instant Ledger Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Toggle */}
        <div className="p-6">
          <div className="flex bg-slate-900 rounded-xl p-1 mb-5 border border-slate-800">
            <button
              onClick={() => setMethod("CRYPTO")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                method === "CRYPTO"
                  ? "bg-slate-800 text-cyan-400 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              Crypto Web3 Transfer
            </button>
            <button
              onClick={() => setMethod("FIAT")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                method === "FIAT"
                  ? "bg-slate-800 text-cyan-400 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Instant Card / Wire (Simulated)
            </button>
          </div>

          {successNotice ? (
            <div className="py-8 flex flex-col items-center text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
              <h4 className="text-base font-bold text-white mb-1">Deposit Confirmed</h4>
              <p className="text-xs text-emerald-400">{successNotice}</p>
            </div>
          ) : method === "CRYPTO" ? (
            <div className="space-y-4">
              {/* Asset choice */}
              <div className="flex items-center gap-2">
                {(["USDT", "BTC", "ETH"] as const).map((coin) => (
                  <button
                    key={coin}
                    onClick={() => setCryptoAsset(coin)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      cryptoAsset === coin
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    {coin}
                  </button>
                ))}
              </div>

              {/* QR Code & Address Simulation */}
              <div className="flex flex-col items-center bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                {/* SVG Mock QR Code */}
                <div className="h-32 w-32 bg-white p-2 rounded-lg flex items-center justify-center mb-3 shadow">
                  <div className="w-full h-full border-4 border-slate-950 flex flex-col items-center justify-center text-[10px] font-mono text-slate-950">
                    <QrCode className="w-20 h-20 text-slate-900" />
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 mb-1">
                  Send {cryptoAsset} to this unique custodial address
                </span>
                <div className="flex items-center gap-2 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-400">
                  <span className="truncate flex-1">{getAddress()}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:text-white text-slate-400 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Simulate Webhook Confirmation Action */}
              <button
                onClick={() =>
                  handleExecuteDeposit(
                    cryptoAsset === "BTC" ? 15000 : cryptoAsset === "ETH" ? 7000 : 5000,
                    `${cryptoAsset} On-Chain Webhook Transfer`
                  )
                }
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4" />
                {loading ? "Simulating Confirmation..." : `Simulate Instant ${cryptoAsset} Deposit Receipt`}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Deposit Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    value={fiatAmount}
                    onChange={(e) => setFiatAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {["1000", "2500", "5000", "10000"].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setFiatAmount(amt)}
                    className="py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all"
                  >
                    +${parseInt(amt).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero Processing Fees • Instant Ledger Credit
                </div>
                <p>Funds are instantly allocated to your Available Margin with full double-entry audit logging.</p>
              </div>

              <button
                onClick={() =>
                  handleExecuteDeposit(parseFloat(fiatAmount) || 1000, "Instant Card / Wire Transfer")
                }
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                {loading ? "Processing..." : `Complete Instant Deposit ($${fiatAmount})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
