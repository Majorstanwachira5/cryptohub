import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AccountType } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountType = (searchParams.get("account_type") || "DEMO") as AccountType;

  const transactions = db.getLedger(accountType);
  return NextResponse.json({ transactions, accountType });
}
