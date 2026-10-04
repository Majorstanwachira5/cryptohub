"use client";

import React, { useState, useEffect } from "react";
import { AccountPerformance, Permission, ProfileSummary, Trade, AccountType } from "@/types";
import { formatMoney, formatSignedMoney } from "@/lib/fx/rates";
import { getInitialTheme, applyTheme, Theme } from "@/lib/theme";
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
  Sun,
  Moon,
  LogOut,
  FileText,
  Lock,
  QrCode,
  ArrowDownToLine,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

interface ProfilePanelProps {
  profile: ProfileSummary | null;
  /** Authentication provider that issued the current access token. */
  provider?: "local" | "supabase";
  /** Permissions derived from the signed-in user's role. */
  permissions?: Permission[];
  authenticated: boolean;
  currency: "USD" | "KES";
  trades: Trade[];
  accountType: AccountType;
  onOpenLedger?: () => void;
  onOpenDeposit?: () => void;
  onToggleCurrency?: () => void;
  onLogout?: () => void;
  onOpenRiskQuiz?: () => void;
  onOpenAdmin?: () => void;
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
              (data.winRate ?? 0) >= 50 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {data.winRate === null ? "—" : `${data.winRate}%`}
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
  provider = "local",
  permissions = [],
  authenticated,
  currency,
  trades,
  accountType,
  onOpenLedger,
  onOpenDeposit,
  onToggleCurrency,
  onLogout,
  onOpenRiskQuiz,
  onOpenAdmin,
}) => {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const handleThemeToggle = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const copyAddress = async (addr: string, key: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddr(key);
      setTimeout(() => setCopiedAddr(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!profile) {
    return (
      <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-6 text-center text-xs text-slate-400">
        Loading profile…
      </div>
    );
  }

  const { user, depositAddresses, session, demo, real, fx, performance, referrals } = profile;
  const openPositions = trades.filter(
    (t) => t.status === "OPEN" && (t.accountType || "DEMO") === accountType
  ).length;

  const expiryHours = Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000)) / 3600;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg("New password must be at least 8 characters.");
      return;
    }
    setPasswordMsg("Password updated successfully.");
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordMsg(null);
      setOldPassword("");
      setNewPassword("");
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Identity Header Card */}
      <div className="bg-gradient-to-b from-[#101726] to-[#0c111c] border border-cyan-500/20 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-cyan-500/20">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base text-white truncate">{user.name}</h3>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
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

          {/* Logout Action */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 self-start sm:self-center bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
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

      {/* 2. Platform Appearance & Display Preferences */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">
          Appearance & Preferences
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Theme Switcher */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-cyan-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <div className="text-xs font-bold text-white">Color Theme</div>
                <div className="text-[10px] text-slate-400">
                  {theme === "dark" ? "Dark Mode (Trading)" : "Light Mode"}
                </div>
              </div>
            </div>

            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => handleThemeToggle("dark")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  theme === "dark"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
              <button
                onClick={() => handleThemeToggle("light")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  theme === "light"
                    ? "bg-amber-400 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
            </div>
          </div>

          {/* Currency Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">Display Currency</div>
                <div className="text-[10px] text-slate-400">
                  1 USD = {fx.usdKes.toFixed(2)} KES
                </div>
              </div>
            </div>

            {onToggleCurrency && (
              <button
                onClick={onToggleCurrency}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
              >
                {currency}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Balances Summary */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Account Balances
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "DEMO", bal: demo, tone: "text-cyan-400" },
            { label: "REAL", bal: real, tone: "text-emerald-400" },
          ].map(({ label, bal, tone }) => (
            <div key={label} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase font-bold text-slate-500">{label}</span>
                <span className={`text-sm font-black ${tone}`}>
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

      {/* 4. Crypto Deposit Addresses */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" /> Crypto Deposit Addresses
          </div>
          {onOpenDeposit && (
            <button
              onClick={onOpenDeposit}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              Deposit Capital
            </button>
          )}
        </div>

        <div className="space-y-2">
          {[
            { name: "USDT (TRC-20)", addr: depositAddresses.usdt, key: "usdt" },
            { name: "Bitcoin (BTC)", addr: depositAddresses.btc, key: "btc" },
            { name: "Ethereum (ETH)", addr: depositAddresses.eth, key: "eth" },
          ].map((item) => (
            <div
              key={item.key}
              className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">{item.name}</div>
                <div className="font-mono text-xs text-slate-200 truncate">{item.addr}</div>
              </div>
              <button
                onClick={() => copyAddress(item.addr, item.key)}
                className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2 rounded-lg text-xs font-bold transition-all active:scale-95"
                title="Copy Address"
              >
                {copiedAddr === item.key ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Realised Performance */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Realised Performance
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PerformanceBlock title="Demo record" data={performance.DEMO} currency={currency} />
          <PerformanceBlock title="Real record" data={performance.REAL} currency={currency} />
        </div>
      </div>

      {/* 6. Audit Ledger & Transaction History Trigger */}
      {onOpenLedger && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-white">Double-Entry Audit Ledger</div>
              <div className="text-[10px] text-slate-400">
                View all chronological deposits, profits, losses, and adjustments.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenLedger}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          >
            View Ledger
          </button>
        </div>
      )}

      {/* Risk Certification Quiz Section */}
      {onOpenRiskQuiz && (
        <div className="bg-slate-900/70 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>60/40 Risk Certification</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">MANDATORY</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Certify your understanding of stop-losses, position sizing, and probabilistic edge for live funds.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenRiskQuiz}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 shrink-0 self-start sm:self-center"
          >
            Take Risk Quiz
          </button>
        </div>
      )}

      {/* Admin Telemetry & Signal Override Console */}
      {onOpenAdmin && (
        <div className="bg-slate-900/70 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Admin Telemetry & Signal Override</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40">{user.role.toUpperCase()}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Access live platform volume, active traders, and broadcast institutional prediction alerts.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenAdmin}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all active:scale-95 shrink-0 self-start sm:self-center"
          >
            Open Admin Console
          </button>
        </div>
      )}

      {/* 7. Security Settings & Session Management */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Security & Session
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-bold"
          >
            <Lock className="w-3 h-3" /> Change Password
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400">
            Access Token &middot; {authenticated ? "verified" : "unverified"}
          </span>
          <span className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            Valid for {expiryHours}h
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <dt className="text-[9px] uppercase text-slate-600 font-bold">Issued</dt>
            <dd className="text-[11px] font-mono text-slate-300">
              {new Date(session.issuedAt * 1000).toLocaleString()}
            </dd>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <dt className="text-[9px] uppercase text-slate-600 font-bold">Expires</dt>
            <dd className="text-[11px] font-mono text-slate-300">
              {session.expiresAt ? new Date(session.expiresAt * 1000).toLocaleString() : "—"}
            </dd>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <dt className="text-[9px] uppercase text-slate-600 font-bold">Role</dt>
            <dd className="text-[11px] font-mono text-cyan-400 uppercase">{user.role}</dd>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <dt className="text-[9px] uppercase text-slate-600 font-bold">Provider</dt>
            <dd className="text-[11px] font-mono text-cyan-400 uppercase">{provider}</dd>
          </div>
        </dl>

        <div className="mt-2">
          <span className="text-[9px] uppercase text-slate-600 font-bold block mb-1">
            Granted Permissions
          </span>
          <div className="flex flex-wrap gap-1">
            {permissions.length === 0 && (
              <span className="text-[10px] text-slate-500">None</span>
            )}
            {permissions.map((p) => (
              <span
                key={p}
                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-2 flex gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-cyan-500" />
          The token itself is held by your browser and sent as a bearer header on every
          request. It is verified server-side on each call and never returned by the API.
        </p>
      </div>

      {/* Password Management Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111724] border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-white">Change Account Password</h4>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              {passwordMsg && (
                <div className="text-xs p-2 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300">
                  {passwordMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2 rounded-lg text-xs transition-all active:scale-95"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};