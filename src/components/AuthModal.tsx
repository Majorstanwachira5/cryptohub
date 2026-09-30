"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, ShieldCheck, Check, Sparkles } from "lucide-react";
import { useToast } from "./Toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (accountType: "DEMO" | "REAL") => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("alex.sterling@quantglobal.com");
  const [password, setPassword] = useState("••••••••••••");
  const [name, setName] = useState("Alex Sterling");
  const [enable2FA, setEnable2FA] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleAuth = async (targetAccount: "DEMO" | "REAL") => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          action: isSignUp ? "signup" : "login",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Authenticated Successfully", `Welcome to CryptoHub ${targetAccount} Terminal`);
        onLoginSuccess(targetAccount);
        onClose();
      }
    } catch {
      onLoginSuccess(targetAccount);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111726] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d121e] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              CH
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {isSignUp ? "Create Quant Account" : "Access Trading Terminal"}
              </h3>
              <p className="text-xs text-slate-400">Institutional Multi-Asset Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {isSignUp && (
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Corporate / Personal Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>
          </div>

          {/* 2FA setting */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold text-white">2FA Security Protocol</div>
                <div className="text-[10px] text-slate-400">Required for on-chain withdrawals</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnable2FA(!enable2FA)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                enable2FA ? "bg-cyan-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  enable2FA ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* Action Split: Demo vs Real Choice */}
          <div className="pt-2 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Select Initial Environment
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAuth("DEMO")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition-all text-center"
              >
                <span className="text-xs font-black text-cyan-400">Launch DEMO</span>
                <span className="text-[10px] text-slate-400 mt-0.5">$10k Virtual Funds</span>
              </button>

              <button
                type="button"
                onClick={() => handleAuth("REAL")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition-all text-center"
              >
                <span className="text-xs font-black text-emerald-400">Launch REAL</span>
                <span className="text-[10px] text-slate-400 mt-0.5">60/40 Live Capital</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Register Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
