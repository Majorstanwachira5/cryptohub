"use client";

import React, { useEffect, useState } from "react";
import { X, Lock, Mail, User, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "./Toast";
import { useSession } from "./SessionProvider";
import { AccountType } from "@/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (accountType: AccountType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [targetAccount, setTargetAccount] = useState<AccountType>("DEMO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register, pendingAccountType, clearPendingAccount } = useSession();
  const { showToast } = useToast();

  // If the user was sent here by clicking DEMO or REAL, honour that choice.
  useEffect(() => {
    if (pendingAccountType) setTargetAccount(pendingAccountType);
  }, [pendingAccountType]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (accountType: AccountType) => {
    setError(null);

    // Reject obviously incomplete input before spending a round trip.
    if (!email.trim()) return setError("Enter your email address.");
    if (!password) return setError("Enter your password.");
    if (mode === "REGISTER" && name.trim().length < 2) {
      return setError("Enter your full name.");
    }

    setLoading(true);
    try {
      const user =
        mode === "REGISTER"
          ? await register({ name, email, password })
          : await login({ email, password });

      showToast(
        "success",
        mode === "REGISTER" ? "Account created" : "Signed in",
        `Welcome, ${user.name}. Opening your ${accountType} account.`
      );

      clearPendingAccount();
      onLoginSuccess(accountType);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "REGISTER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111726] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d121e] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              CH
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {isRegister ? "Create Your Account" : "Sign In"}
              </h3>
              <p className="text-xs text-slate-400">
                {isRegister
                  ? "Registration is required before any account can be used"
                  : "Authenticate to reach your demo or real account"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Mode switch */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(["LOGIN", "REGISTER"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 px-3 py-1.5 rounded-md font-bold transition-all ${
                  mode === m ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "LOGIN" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {isRegister && (
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Kamau"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit(targetAccount);
                }}
                placeholder={isRegister ? "At least 8 characters, with a number" : "Your password"}
                className="w-full pl-9 pr-16 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 px-2"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {isRegister && (
              <p className="text-[10px] text-slate-500 mt-1">
                Stored as a salted scrypt hash. It is never logged or returned.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-950/50 border border-rose-800 rounded-lg px-3 py-2 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          {/* Account choice */}
          <div className="pt-1 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              {isRegister ? "Register And Open" : "Sign In To"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => submit("DEMO")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition-all text-center disabled:opacity-60"
              >
                <span className="text-xs font-black text-cyan-400">DEMO</span>
                <span className="text-[10px] text-slate-400 mt-0.5">$10k Virtual Funds</span>
              </button>

              <button
                type="button"
                onClick={() => submit("REAL")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition-all text-center disabled:opacity-60"
              >
                <span className="text-xs font-black text-emerald-400">REAL</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Live Capital</span>
              </button>
            </div>
            {loading && (
              <div className="text-center text-[11px] text-cyan-400 font-bold">
                {isRegister ? "Creating your account…" : "Verifying credentials…"}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed border-t border-slate-800 pt-3">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-cyan-500" />
            <span>
              Your password is verified on the server and never leaves it. The access token you
              receive is checked on every request, and your role decides what you may do.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};