import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatePnL, calculatePips } from "@/lib/trading/pips";
import { AccountType } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountType = (searchParams.get("account_type") || "DEMO") as AccountType;

  const trades = db.getTrades(accountType);
  const balance = db.getBalance(accountType);
  return NextResponse.json({ trades, balance, accountType });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, accountType = "DEMO" } = body as {
      updates: Array<{ id: string; currentPrice: number }>;
      accountType?: AccountType;
    };

    if (Array.isArray(updates)) {
      for (const item of updates) {
        const trade = db.getTrades(accountType).find((t) => t.id === item.id);
        if (trade && trade.status === "OPEN") {
          const pnl = calculatePnL(
            trade.entryPrice,
            item.currentPrice,
            trade.size,
            trade.direction,
            trade.assetClass,
            trade.symbol
          );
          const pips = calculatePips(
            trade.entryPrice,
            item.currentPrice,
            trade.direction,
            trade.symbol,
            trade.assetClass
          );
          db.updatePositionPrice(item.id, item.currentPrice, pnl, pips, accountType);
        }
      }
    }

    const updatedTrades = db.getTrades(accountType);
    const updatedBalance = db.getBalance(accountType);

    return NextResponse.json({ trades: updatedTrades, balance: updatedBalance });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update prices" }, { status: 400 });
  }
}
