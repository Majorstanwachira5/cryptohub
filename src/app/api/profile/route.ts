import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFxRates, usdToKes, DisplayCurrency } from "@/lib/fx/rates";
import { requireIdentity } from "@/lib/auth/access";
import { permissionsFor } from "@/lib/auth/rbac";
import { computeAccountPerformance } from "@/lib/analysis";
import { AuthenticatedUser, ProfileSummary, ReferralStats } from "@/types";

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
  // The profile is private: there is no unauthenticated fallback. If a token
  // is missing or stale the client is expected to register or sign in again.
  const auth = await requireIdentity(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const fx = getFxRates();
  const identity: AuthenticatedUser = auth.identity.user;

  const summary: ProfileSummary = {
    user: identity,
    depositAddresses: {
      usdt: db.getUser().usdtAddress,
      btc: db.getUser().btcAddress,
      eth: db.getUser().ethAddress,
    },
    session: {
      issuedAt: auth.identity.issuedAt ?? Math.floor(Date.now() / 1000),
      expiresAt: auth.identity.expiresAt ?? 0,
    },
    demo: db.getBalance("DEMO"),
    real: db.getBalance("REAL"),
    fx: { usdKes: fx.usdKes, displayCurrency: fx.displayCurrency as DisplayCurrency },
    performance: {
      DEMO: computeAccountPerformance(db.getTrades("DEMO"), "DEMO"),
      REAL: computeAccountPerformance(db.getTrades("REAL"), "REAL"),
    },
    referrals: referralStats(),
    openPositions: db.getTrades("DEMO").filter((t) => t.status === "OPEN").length,
  };

  return NextResponse.json({
    ...summary,
    authenticated: true,
    provider: auth.identity.provider,
    permissions: permissionsFor(identity.role),
  });
}