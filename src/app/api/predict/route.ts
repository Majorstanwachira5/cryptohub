import { NextRequest, NextResponse } from "next/server";
import { generateCandleHistory, DEFAULT_ASSETS } from "@/lib/market/assets";
import { generateQuantitativePrediction } from "@/lib/indicators/technical";
import { HISTORICAL_BACKTEST_SETUPS } from "@/lib/indicators/backtest";
import { db } from "@/lib/db";
import { AssetClass, AccountType } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const timeframe = searchParams.get("timeframe") || "1H";
  const mode = searchParams.get("mode"); // "backtest" | "live"
  const accountType = (searchParams.get("account_type") || "DEMO") as AccountType;

  // Check if backtest mode requested
  if (mode === "backtest") {
    const matchingBacktest =
      HISTORICAL_BACKTEST_SETUPS.find((b) => b.symbol === symbol) ||
      HISTORICAL_BACKTEST_SETUPS[0];
    return NextResponse.json({
      backtest: matchingBacktest,
      allSetups: HISTORICAL_BACKTEST_SETUPS,
    });
  }

  // Check if admin has set an override
  const override = db.getLatestPrediction(symbol);
  if (override && override.isAdminOverride) {
    return NextResponse.json(override);
  }

  const asset = DEFAULT_ASSETS.find((a) => a.symbol === symbol) || DEFAULT_ASSETS[0];
  const priceParam = searchParams.get("current_price");
  const actualPrice = priceParam ? parseFloat(priceParam) : asset.currentPrice;

  const candles = generateCandleHistory(
    actualPrice,
    asset.assetClass === "FOREX" ? 0.003 : 0.015,
    120
  );

  const prediction = generateQuantitativePrediction(
    candles,
    asset.symbol,
    asset.assetClass as AssetClass,
    timeframe,
    accountType,
    actualPrice
  );

  db.savePrediction(prediction);

  return NextResponse.json(prediction);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      assetClass,
      timeframe,
      direction,
      confidence,
      entryPrice,
      takeProfit,
      stopLoss,
      rationale,
    } = body;

    // Admin manual prediction override
    const prediction = {
      id: `pred_override_${Date.now()}`,
      symbol: symbol || "BTCUSDT",
      assetClass: assetClass || "CRYPTO",
      timeframe: timeframe || "1H",
      direction: direction || "LONG",
      confidence: confidence || 92,
      entryPrice: entryPrice || 64500,
      takeProfit: takeProfit || 67500,
      stopLoss: stopLoss || 63200,
      riskRewardRatio: "1:2.3",
      winRateEstimate: "68%",
      indicators: {
        rsi: 42,
        rsiSignal: "NEUTRAL" as const,
        macd: { macdLine: 120, signalLine: 80, histogram: 40, cross: "BULLISH_CROSS" as const },
        ema50: entryPrice * 0.99,
        ema200: entryPrice * 0.97,
        emaTrend: "GOLDEN_ALIGNMENT" as const,
      },
      rationale: rationale || "Institutional Market Signal Broadcasted by Lead Quantitative Architect.",
      isAdminOverride: true,
      createdAt: new Date().toISOString(),
    };

    db.savePrediction(prediction);

    return NextResponse.json({ success: true, prediction });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid prediction payload" }, { status: 400 });
  }
}
