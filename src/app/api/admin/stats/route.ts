import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Platform-wide figures. Available to administrators only.
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const stats = db.getAdminStats();
  const trades = db.getTrades();
  const user = db.getUser();
  const balance = db.getBalance();

  return NextResponse.json({ stats, trades, user, balance, requestedBy: auth.identity.user.email });
}