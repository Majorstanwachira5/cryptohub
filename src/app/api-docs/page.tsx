"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "swagger-ui-react/swagger-ui.css";
import { ArrowLeft, Shield, Terminal } from "lucide-react";

// Dynamically import SwaggerUI to prevent SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    import("./swagger.json").then((data) => {
      setSpec(data.default || data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Terminal
          </Link>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold tracking-wide text-white">
              CryptoHub End-to-End API Documentation (Swagger OpenAPI 3.0)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-[11px] font-mono text-emerald-400">
            <Shield className="w-3 h-3" />
            Supabase Protected
          </span>
          <Link
            href="/auth"
            className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
          >
            Auth Gateway
          </Link>
        </div>
      </header>

      {/* Swagger Interactive Viewer Container */}
      <main className="flex-1 bg-white p-4 sm:p-8 overflow-y-auto text-slate-900">
        <div className="max-w-6xl mx-auto">
          {spec ? (
            <SwaggerUI spec={spec} />
          ) : (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              Loading interactive API specifications...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
