import { NextRequest, NextResponse } from "next/server";
import { buildAnalysisReport } from "@/lib/analysis";
import { DEFAULT_ASSETS } from "@/lib/market/assets";
import { AccountType, AssetClass } from "@/types";

// Indicator and replay work is heavier than a JSON lookup, so it runs per
// request rather than on a timer.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const timeframe = searchParams.get("timeframe") || "1H";
  const accountType = (searchParams.get("account_type") || "DEMO") as AccountType;
  const priceParam = searchParams.get("current_price");
  const currentPrice = priceParam ? parseFloat(priceParam) : undefined;
  const includeBacktest = searchParams.get("backtest") !== "false";

  const asset =
    DEFAULT_ASSETS.find((a) => a.symbol === symbol) || DEFAULT_ASSETS[0];

  try {
    const report = buildAnalysisReport({
      symbol: asset.symbol,
      timeframe,
      accountType: accountType === "REAL" ? "REAL" : "DEMO",
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