import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFxRates, usdToKes, DisplayCurrency } from "@/lib/fx/rates";
import { signSession, readSession, verifySession } from "@/lib/auth/jwt";
import { computeAccountPerformance } from "@/lib/analysis";
import { ProfileSummary, ReferralStats } from "@/types";

export const dynamic = "force-dynamic";

function referralStats(): ReferralStats {
  const rewardUsd = db.getReferralRewardUsd();
  const records = db.getReferrals();
  const totalEarnedUsd =
    Math.round(records.reduce((a, r) => a + r.rewardUsd, 0) * 100) / 100;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 4000}`;

  return {
    code: db.getReferralCode(),
    rewardPerReferralUsd: rewardUsd,
    rewardPerReferralKes: usdToKes(rewardUsd),
    totalReferrals: records.length,
    qualified: records.filter((r) => r.status === "QUALIFIED").length,
    pending: records.filter((r) => r.status === "PENDING").length,
    totalEarnedUsd,
    totalEarnedKes: usdToKes(totalEarnedUsd),
    shareUrl: `${baseUrl}/auth?ref=${db.getReferralCode()}`,
    records,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fx = getFxRates();

  // A token may arrive as a Bearer header or a query parameter. The query form
  // exists because <img> and download-style requests cannot set headers.
  const session =
    readSession(request.headers.get("authorization")) ??
    verifySession(searchParams.get("session") || "");

  const user = db.getUser();
  const accountType = session?.accountType === "REAL" ? "REAL" : "DEMO";

  const token = session
    ? `${request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? searchParams.get("session")}`
    : signSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountType,
      });

  const issuedAt = session?.iat ?? Math.floor(Date.now() / 1000);
  const expiresAt = session?.exp ?? issuedAt + 60 * 60 * 24 * 7;

  const summary: ProfileSummary = {
    user: session ? { ...user, email: session.email, name: session.name } : user,
    session: { token, issuedAt, expiresAt },
    demo: db.getBalance("DEMO"),
    real: db.getBalance("REAL"),
    fx: { usdKes: fx.usdKes, displayCurrency: fx.displayCurrency as DisplayCurrency },
    performance: {
      DEMO: computeAccountPerformance(db.getTrades("DEMO"), "DEMO"),
      REAL: computeAccountPerformance(db.getTrades("REAL"), "REAL"),
    },
    referrals: referralStats(),
    openPositions: db.getTrades(accountType).filter((t) => t.status === "OPEN").length,
  };

  return NextResponse.json({ ...summary, authenticated: Boolean(session) });
}