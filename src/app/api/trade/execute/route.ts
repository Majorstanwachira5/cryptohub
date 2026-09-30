import { NextRequest, NextResponse } from "next/server";
import { executeOrder } from "@/lib/trading/engine";
import { db } from "@/lib/db";
import { AccountType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountType = "DEMO",
      symbol,
      assetClass,
      direction,
      orderType,
      size,
      leverage,
      currentPrice,
      stopLoss,
      takeProfit,
      rationale,
    } = body;

    if (!symbol || !direction || !size || !leverage || !currentPrice) {
      return NextResponse.json(
        { success: false, error: "Missing required trade execution parameters." },
        { status: 400 }
      );
    }

    const result = executeOrder({
      accountType: accountType as AccountType,
      symbol,
      assetClass: assetClass || "CRYPTO",
      direction,
      orderType: orderType || "MARKET",
      size: Number(size),
      leverage: Number(leverage),
      currentPrice: Number(currentPrice),
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
      rationale,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const updatedBalance = db.getBalance(accountType as AccountType);

    return NextResponse.json({
      success: true,
      trade: result.trade,
      balance: updatedBalance,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to execute order: " + (error as Error).message },
      { status: 500 }
    );
  }
}
