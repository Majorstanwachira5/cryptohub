import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AccountType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, method, txHash, accountType = "REAL", action } = body;

    // If Demo virtual reset
    if (action === "reset_demo" || (accountType === "DEMO" && !amount)) {
      const resetBal = db.resetDemoBalance();
      return NextResponse.json({
        success: true,
        balance: resetBal,
        message: "Demo virtual balance reset to $10,000.00 USD",
      });
    }

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid deposit amount is required." },
        { status: 400 }
      );
    }

    const updatedBalance = db.depositFunds(
      depositAmount,
      method || "Instant Fiat / Card Simulation",
      txHash,
      accountType as AccountType
    );

    const latestLedger = db.getLedger(accountType as AccountType);

    return NextResponse.json({
      success: true,
      balance: updatedBalance,
      latestTransaction: latestLedger[0],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Deposit processing failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
