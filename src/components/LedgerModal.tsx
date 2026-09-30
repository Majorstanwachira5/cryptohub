"use client";

import React, { useEffect, useState } from "react";
import { LedgerEntry, AccountType } from "@/types";
import {
  X,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: AccountType;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  accountType,
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ledger/transactions?account_type=${accountType}`);
      const data = await res.json();
      setEntries(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLedger();
    }
  }, [isOpen, accountType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#101625] border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c101c]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Financial Audit Ledger
                </h3>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                    accountType === "REAL"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                  }`}
                >
                  {accountType}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Double-Entry Accounting & Immutable Financial Movements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLedger}
              className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-slate-800"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No transactions found for {accountType} account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d121c] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Balance After</th>
                    <th className="py-2.5 px-3">Description & Reference</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {entries.map((item) => {
                    const isCredit =
                      item.type === "DEPOSIT" ||
                      item.type === "TRADE_PROFIT" ||
                      item.type === "DEMO_RESET";
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCredit
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            }`}
                          >
                            {item.type === "DEPOSIT" && <ArrowDownLeft className="w-3 h-3" />}
                            {item.type === "WITHDRAWAL" && <ArrowUpRight className="w-3 h-3" />}
                            {item.type === "TRADE_PROFIT" && <TrendingUp className="w-3 h-3" />}
                            {item.type === "TRADE_LOSS" && <TrendingDown className="w-3 h-3" />}
                            {item.type === "DEMO_RESET" && <RotateCcw className="w-3 h-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 font-bold ${
                            isCredit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isCredit ? "+" : ""}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {item.currency}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-semibold">
                          ${item.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <div>{item.description}</div>
                          {item.txHash && (
                            <span className="font-mono text-[10px] text-cyan-400/80 truncate block max-w-xs">
                              Ref: {item.txHash}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
