import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAccountAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const auth = await requireAccountAccess(request, searchParams.get("account_type") ?? "DEMO");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = db.getUser();
  const balance = db.getBalance(auth.accountType);

  return NextResponse.json({
    user,
    balance,
    accountType: auth.accountType,
    session: { id: auth.identity.user.id, role: auth.identity.user.role },
  });
}