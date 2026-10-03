import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAccountAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

/**
 * Credits an account.
 *
 * SECURITY NOTE: deposits here are a simulation. There is no payment
 * provider, no chain confirmation, and no reconciliation step between the
 * amount credited and money actually received. Authentication and RBAC decide
 * WHO may credit an account; they cannot make the credit itself real. Before
 * this endpoint accepts genuine funds it needs a provider callback that
 * verifies settlement server side.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, method, txHash, accountType = "REAL", action } = body;

    // Gate before any state is read or written.
    const auth = await requireAccountAccess(request, accountType);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // A demo reset must never be reachable with a REAL-scoped token.
    if (action === "reset_demo") {
      if (auth.accountType !== "DEMO") {
        return NextResponse.json(
          { success: false, error: "Only the demo account can be reset." },
          { status: 403 }
        );
      }
      const resetBal = db.resetDemoBalance();
      return NextResponse.json({
        success: true,
        balance: resetBal,
        message: "Demo virtual balance reset to $10,000.00 USD",
      });
    }

    if (auth.accountType === "DEMO" && !amount) {
      const resetBal = db.resetDemoBalance();
      return NextResponse.json({
        success: true,
        balance: resetBal,
        message: "Demo virtual balance reset to $10,000.00 USD",
      });
    }

    const depositAmount = Number(amount);
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid deposit amount is required." },
        { status: 400 }
      );
    }

    // Bounds guard: reject NaN, Infinity and absurd values rather than
    // letting them poison the balance arithmetic.
    if (depositAmount > 10_000_000) {
      return NextResponse.json(
        { success: false, error: "Deposit amount exceeds the permitted maximum." },
        { status: 400 }
      );
    }

    const updatedBalance = db.depositFunds(
      depositAmount,
      method || "Instant Fiat / Card Simulation",
      txHash,
      auth.accountType
    );

    const latestLedger = db.getLedger(auth.accountType);

    return NextResponse.json({
      success: true,
      balance: updatedBalance,
      latestTransaction: latestLedger[0],
      simulated: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Deposit processing failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}