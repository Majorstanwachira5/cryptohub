"use client";

import React, { useEffect, useState } from "react";
import { ReferralStats } from "@/types";
import { formatMoney } from "@/lib/fx/rates";
import {
  Gift,
  Copy,
  Check,
  Users,
  Wallet,
  Mail,
  Plus,
  ShieldCheck,
} from "lucide-react";

interface ReferralPanelProps {
  stats: ReferralStats | null;
  currency: "USD" | "KES";
  onSubmitted: () => void;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({
  stats,
  currency,
  onSubmitted,
}) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copyCode = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(stats.code);
      setCopied(true);
    } catch {
      setMessage({ kind: "err", text: "Clipboard unavailable. Copy the code manually." });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: stats?.code, email, name }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({
          kind: "ok",
          text: `Reward credited: ${formatMoney(data.reward.amountUsd, currency)} to your REAL account.`,
        });
        setEmail("");
        setName("");
        onSubmitted();
      } else {
        setMessage({ kind: "err", text: data.error || "Could not register that referral." });
      }
    } catch {
      setMessage({ kind: "err", text: "Network error. Check your connection and retry." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!stats) {
    return (
      <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-6 text-center text-xs text-slate-400">
        Loading referral data…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-wide">REFERRAL PROGRAM</h3>
            <p className="text-[11px] text-slate-400">
              Earn {formatMoney(stats.rewardPerReferralUsd, currency)} per verified referral
            </p>
          </div>
        </div>
      </div>

      {/* Code + share */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
          Your Referral Code
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-2xl font-black tracking-[0.3em] text-cyan-400 bg-slate-950 border border-cyan-900/60 rounded-lg px-4 py-3 text-center">
            {stats.code}
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-3 rounded-lg text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> Referred
            </div>
            <div className="text-lg font-black text-white">{stats.totalReferrals}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Qualified</div>
            <div className="text-lg font-black text-emerald-400">{stats.qualified}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Earned USD
            </div>
            <div className="text-lg font-black text-emerald-400">
              ${stats.totalEarnedUsd.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Earned KES</div>
            <div className="text-lg font-black text-cyan-400">
              KSh {stats.totalEarnedKes.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <form onSubmit={submit} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Add Someone You Referred
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Their email address"
            className="bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-600"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Their name (optional)"
            className="bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-600"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-lg text-xs tracking-wide transition-all active:scale-[0.99] disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1" />
          {submitting ? "Crediting..." : `Credit ${formatMoney(stats.rewardPerReferralUsd, currency)}`}
        </button>

        {message && (
          <div
            className={`text-[11px] rounded-lg border px-3 py-2 ${
              message.kind === "ok"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-rose-950/40 border-rose-800 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-[10px] text-slate-500 leading-relaxed flex gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-cyan-500" />
          Rewards are paid in USD into your REAL account only, never DEMO. Each email is paid once.
          Credits are recorded in your ledger as a referral bonus.
        </p>
      </form>

      {/* Records */}
      {stats.records.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
            Referral History
          </div>
          <div className="space-y-1.5">
            {stats.records.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-200 truncate">{r.referredEmail}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(r.createdAt).toLocaleString("en-KE")} · {r.status}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 shrink-0">
                  +${r.rewardUsd.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};