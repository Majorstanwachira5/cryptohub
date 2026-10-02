"use client";

import React, { useState } from "react";
import { AccountPerformance, ProfileSummary, Trade } from "@/types";
import { formatMoney, formatSignedMoney } from "@/lib/fx/rates";
import {
  User,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Gift,
  KeyRound,
  Clock,
} from "lucide-react";

interface ProfilePanelProps {
  profile: ProfileSummary | null;
  authenticated: boolean;
  currency: "USD" | "KES";
  trades: Trade[];
  accountType: "DEMO" | "REAL";
}

function PerformanceBlock({
  title,
  data,
  currency,
}: {
  title: string;
  data: AccountPerformance | null;
  currency: "USD" | "KES";
}) {
  if (!data) {
    return (
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
        <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">{title}</div>
        <div className="text-[11px] text-slate-500">No closed trades yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
      <div className="text-[9px] uppercase font-bold text-slate-500 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[9px] uppercase text-slate-600">Win rate</div>
          <div
            className={`text-sm font-black ${
              data.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {data.winRate}%
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-slate-600">Net PnL</div>
          <div
            className={`text-sm font-black ${
              data.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatSignedMoney(data.netPnl, currency)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-slate-600">W / L</div>
          <div className="text-xs font-bold text-slate-200">
            {data.wins} / {data.losses}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-slate-600">Profit factor</div>
          <div className="text-xs font-bold text-slate-200">
            {data.profitFactor === null ? "n/a" : data.profitFactor.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  profile,
  authenticated,
  currency,
  trades,
  accountType,
}) => {
  const [copied, setCopied] = useState(false);

  if (!profile) {
    return (
      <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-6 text-center text-xs text-slate-400">
        Loading profile…
      </div>
    );
  }

  const { user, session, demo, real, fx, performance, referrals } = profile;
  const openPositions = trades.filter(
    (t) => t.status === "OPEN" && (t.accountType || "DEMO") === accountType
  ).length;

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(session.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const expiresIn = Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000));
  const expiryHours = Math.floor(expiresIn / 3600);

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-white truncate">{user.name}</h3>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                  authenticated
                    ? "bg-emerald-950/70 text-emerald-400 border-emerald-700/70"
                    : "bg-amber-950/70 text-amber-400 border-amber-700/70"
                }`}
              >
                {authenticated ? "Session verified" : "Unverified session"}
              </span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
                {user.role}
              </span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
                KYC {user.kycStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">User ID</div>
            <div className="text-[11px] font-mono text-cyan-400 truncate">{user.id}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Referral code</div>
            <div className="text-[11px] font-mono text-amber-400">{referrals.code}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Token expires
            </div>
            <div className="text-[11px] font-mono text-slate-300">in {expiryHours}h</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Open positions</div>
            <div className="text-[11px] font-mono text-slate-300">{openPositions}</div>
          </div>
        </div>
      </div>

      {/* Session token */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Session Token (JWT)
          </div>
          <button
            onClick={copyToken}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <code className="block font-mono text-[10px] text-slate-400 bg-slate-950 border border-slate-800 rounded-lg p-2.5 break-all">
          {session.token}
        </code>
        <p className="text-[10px] text-slate-500 mt-2 flex gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-cyan-500" />
          HS256, signed with JWT_SECRET. Present it as `Authorization: Bearer &lt;token&gt;` on
          authenticated routes.
        </p>
      </div>

      {/* Balances */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Accounts
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "DEMO", bal: demo, tone: "text-cyan-400" },
            { label: "REAL", bal: real, tone: "text-emerald-400" },
          ].map(({ label, bal, tone }) => (
            <div key={label} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase font-bold text-slate-500">{label}</span>
                <span className={`text-[9px] font-black ${tone}`}>
                  {formatMoney(bal.availableBalance, currency)}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equity</span>
                  <span className="text-slate-200 font-semibold">
                    {formatMoney(bal.equity, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposited</span>
                  <span className="text-slate-200 font-semibold">
                    {formatMoney(bal.totalDeposited, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Free margin</span>
                  <span className="text-slate-200 font-semibold">
                    {formatMoney(bal.freeMargin, currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Realised Performance
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PerformanceBlock title="Demo record" data={performance.DEMO} currency={currency} />
          <PerformanceBlock title="Real record" data={performance.REAL} currency={currency} />
        </div>
      </div>

      {/* Referral summary */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5 text-amber-400" /> Referrals
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Referred</div>
            <div className="text-lg font-black text-white">{referrals.totalReferrals}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Per referral</div>
            <div className="text-sm font-black text-amber-400">
              {formatMoney(referrals.rewardPerReferralUsd, currency)}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Earned USD</div>
            <div className="text-sm font-black text-emerald-400">
              ${referrals.totalEarnedUsd.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[9px] uppercase font-bold text-slate-500">Earned KES</div>
            <div className="text-sm font-black text-cyan-400">
              KSh {referrals.totalEarnedKes.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* FX */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">
              Conversion rate
            </div>
            <div className="text-xs text-slate-200 font-mono">
              1 USD = {fx.usdKes.toFixed(2)} KES
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-500">Displaying in</div>
          <div className="text-xs text-cyan-400 font-black">{currency}</div>
        </div>
      </div>
    </div>
  );
};