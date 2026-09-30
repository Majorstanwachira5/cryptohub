import { NextRequest, NextResponse } from "next/server";
import { closeOrder } from "@/lib/trading/engine";
import { db } from "@/lib/db";
import { AccountType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tradeId, exitPrice, accountType = "DEMO" } = body;

    if (!tradeId || !exitPrice) {
      return NextResponse.json(
        { success: false, error: "tradeId and exitPrice are required." },
        { status: 400 }
      );
    }

    const result = closeOrder(tradeId, Number(exitPrice), accountType as AccountType);
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
      { success: false, error: "Failed to close trade: " + (error as Error).message },
      { status: 500 }
    );
  }
}
