import { NextRequest, NextResponse } from "next/server";
import { buildAnalysisReport } from "@/lib/analysis";
import { DEFAULT_ASSETS } from "@/lib/market/assets";
import { requireAccountAccess, platformUserId } from "@/lib/auth/access";
import { AssetClass } from "@/types";

// Indicator and replay work is heavier than a JSON lookup, so it runs per
// request rather than on a timer.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const timeframe = searchParams.get("timeframe") || "1H";
  const priceParam = searchParams.get("current_price");
  const currentPrice = priceParam ? parseFloat(priceParam) : undefined;
  const includeBacktest = searchParams.get("backtest") !== "false";

  // Analysis reads account state (equity, realised record), so it is gated on
  // the permission for the book being inspected.
  const auth = await requireAccountAccess(request, searchParams.get("account_type") ?? "DEMO");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const asset =
    DEFAULT_ASSETS.find((a) => a.symbol === symbol) || DEFAULT_ASSETS[0];

  try {
    const report = buildAnalysisReport({
      userId: platformUserId(auth.identity),
      symbol: asset.symbol,
      timeframe,
      accountType: auth.accountType,
      currentPrice:
        currentPrice !== undefined && Number.isFinite(currentPrice)
          ? currentPrice
          : asset.currentPrice,
      includeBacktest,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      {
        error: "Analysis engine failed to produce a report for this symbol.",
        assetClass: asset.assetClass as AssetClass,
      },
      { status: 500 }
    );
  }
}