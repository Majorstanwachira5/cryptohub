import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoHub | Institutional Crypto & Forex Quantitative Trading Platform",
  description:
    "High-frequency institutional trading platform for Crypto and Forex markets with algorithmic 60/40 risk management, real-time TradingView charts, and automated quantitative prediction signals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
