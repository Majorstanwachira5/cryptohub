import { NextRequest, NextResponse } from "next/server";
import { requireIdentity } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `
You are "Mike Trades", the institutional quantitative trading assistant for the CryptoHub platform.
CryptoHub is an institutional-grade cryptocurrency and Forex trading platform featuring automated quantitative prediction signals, real-time TradingView charts, and algorithmic risk management.

Key CryptoHub Platform Knowledge:
1. 60/40 Risk Model:
   - Real accounts trade under a strict 60/40 quantitative risk framework.
   - Requires a minimum 1:1.5 Reward-to-Risk ratio on all live positions.
   - Caps individual trade risk to maximum 2.0% of available capital.
   - Mandatory Stop Loss and Take Profit on all Real account trades.
   - IMPORTANT: Always explain that 60/40 represents a disciplined probabilistic framework, NOT a mathematically guaranteed outcome. Market variance exists, and no trading strategy guarantees profits.

2. Account Types:
   - DEMO Account: $10,000.00 virtual capital allocation for risk-free strategy practice and familiarization with platform features. Can be reset to $10,000 anytime via the Navbar or Profile.
   - REAL Account: Live capital environment requiring deposited funds (USDT/BTC/ETH). Enforces strict automated risk checks (mandatory SL, 1:1.5 RR, 2% max risk).

3. Referral Program:
   - Every verified referral earns $5.00 USD credited directly to the trader's REAL account balance (not demo).
   - Each referred trader is paid once. Unique deterministic referral code and share link available in the Referral section.

4. Trading Instruments:
   - Cryptocurrencies: BTC/USDT, ETH/USDT, SOL/USDT.
   - Forex pairs: EUR/USD, GBP/USD, USD/JPY with pip-based PnL calculations.

5. Technical Indicators & Predictions:
   - Quantitative signals combine RSI (overbought >70, oversold <30), MACD histogram momentum, and multi-timeframe Exponential Moving Averages (EMA 20/50/200).

Guidelines for your responses:
- Friendly, professional, institutional, and educational.
- Clear and concise bullet points where appropriate.
- Always include realistic risk disclaimers when discussing trading strategies.
- Never promise guaranteed profits or financial returns.
- You CANNOT execute trades, transfer money, or change balances directly.
`;

// Intelligent Domain Knowledge Generator when external LLM API key is not supplied
function generateLocalKnowledgeResponse(userQuery: string): string {
  const query = userQuery.toLowerCase();

  if (query.includes("60/40") || query.includes("risk model") || query.includes("win rate")) {
    return `### The CryptoHub 60/40 Quantitative Risk Model

The **60/40 Risk Model** is our proprietary risk-containment framework designed to maintain positive expected value over a series of market setups:

* **Minimum 1:1.5 Reward-to-Risk Ratio:** Every live order must target at least $1.50 in potential profit for every $1.00 risked. This ensures that even with market variance, a disciplined trader remains statistically solvent.
* **Maximum 2.0% Capital Risk:** No single position is permitted to risk more than 2% of total account equity on Stop Loss.
* **Mandatory Stop Loss & Take Profit:** On Real accounts, orders without verified stop losses or take profits are blocked by the risk engine to eliminate catastrophic liquidation risk.

⚠️ **Important Risk Notice:**
The 60/40 model is a probabilistic discipline, not a mathematical certainty. Individual market outcomes are subject to volatility, slippage, and economic events. Trading involves risk of loss.`;
  }

  if (query.includes("demo") || query.includes("virtual") || query.includes("practice") || query.includes("reset")) {
    return `### CryptoHub Demo Trading Account

The **Demo Account** is designed to help you master market execution with zero financial risk:

* **$10,000.00 Virtual Capital:** Every trader starts with a full virtual allocation.
* **Realistic Drift & Order Engine:** Practice live Market and Limit orders across BTC, ETH, SOL, EUR/USD, and GBP/USD with real-time candlestick charts.
* **1-Click Reset:** If you want to start fresh or test a new strategy, use the **Reset ($10k)** button in the top navigation or on your Profile to instantly restore your virtual balance.
* **Switch Anytime:** Toggle between DEMO and REAL with the account switcher buttons at the top of your screen or on your mobile dashboard.`;
  }

  if (query.includes("real") || query.includes("deposit") || query.includes("live") || query.includes("fund")) {
    return `### Real Account Trading & Capital Funding

Trading on the **Real Account** connects your execution to live market liquidity with strict capital preservation controls:

1. **Funding Your Account:** Click the green **Deposit Capital** button in the top bar or inside the Profile tab. We support direct on-chain deposits in:
   - **USDT (TRC-20)**
   - **Bitcoin (BTC)**
   - **Ethereum (ETH)**
2. **Double-Entry Ledger:** Every deposit and realized profit/loss is audited and logged in your immutable transaction ledger.
3. **Execution Safety:** The automated Risk Engine will verify your Stop Loss, Take Profit, and leverage before releasing orders to the market.

Remember: Real funds are at risk. Start small and practice on Demo until you are comfortable with position sizing!`;
  }

  if (query.includes("referral") || query.includes("invite") || query.includes("earn") || query.includes("bonus") || query.includes("share")) {
    return `### CryptoHub Referral Program

You can earn real cash rewards by introducing other traders to CryptoHub:

* **$5.00 USD Per Verified Referral:** Every qualified referral credits $5.00 USD directly to your **REAL account balance** (available for live trading).
* **Deterministic Referral Code:** Find your unique 6-character code in the **Referral** tab.
* **One-Click Sharing:** Copy your personalized referral link or tap "Share" on your Android device to send directly via WhatsApp, Telegram, or email.
* **Transparent Tracking:** View all qualified and pending referral rewards in your referral history log.`;
  }

  if (query.includes("rsi") || query.includes("macd") || query.includes("indicator") || query.includes("chart") || query.includes("prediction")) {
    return `### Quantitative Signals & Technical Analysis

CryptoHub provides institutional quantitative confluence across all supported assets:

* **RSI (Relative Strength Index):** Measures price momentum. Readings above 70 indicate overbought conditions (potential pullback), while readings below 30 indicate oversold conditions (potential bounce).
* **MACD (Moving Average Convergence Divergence):** Highlights trend momentum shifts when the fast signal line crosses the baseline.
* **Multi-Timeframe EMA:** Evaluates Exponential Moving Averages (20, 50, 200 periods) to confirm whether the broader market regime is bullish or bearish.
* **Prediction Panel:** Our automated quantitative engine analyzes these signals in real-time, providing an estimated direction, entry price, take-profit, and stop-loss target with 1-click execution.`;
  }

  if (query.includes("stop loss") || query.includes("take profit") || query.includes("sl") || query.includes("tp")) {
    return `### Stop Loss & Take Profit Protection

Risk containment is built directly into CryptoHub:

* **Stop Loss (SL):** An automated price trigger that immediately closes a losing trade to contain capital loss. On Real accounts, Stop Loss is mandatory.
* **Take Profit (TP):** An automated price trigger that locks in profits when the market hits your target.
* **Dynamic Drift Engine:** In demo mode, our price engine models natural candlestick oscillations while respecting your SL and TP boundaries.
* **1-Click Risk Presets:** In the Trade Ticket, tap the 0.5%, 1.0%, or 2.0% risk presets to automatically calculate the optimal position size for your account balance!`;
  }

  // Default helpful response
  return `Hello! I am **Mike Trades**, your institutional trading assistant on CryptoHub.

I can assist you with:
- **60/40 Risk Model:** Learn how our 1:1.5 reward-to-risk rules and 2% risk caps safeguard live capital.
- **Demo Trading:** How to test strategies using your $10,000 virtual balance.
- **Live Trading & Deposits:** How to fund your Real account and navigate live execution.
- **Referral Rewards:** How to share your code and earn $5.00 USD per verified trader.
- **Technical Analysis:** Understanding RSI, MACD, candlestick timeframes, and quantitative predictions.

What topic would you like to dive into today?`;
}

export async function POST(request: NextRequest) {
  try {
    // Mike lives inside the terminal, and this handler spends a metered
    // provider key. Without a token it would let anyone who can reach the
    // server bill the account, so identity is required before any prompt is
    // read or forwarded.
    const auth = await requireIdentity(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];

    if (!messages.length) {
      return NextResponse.json(
        { success: false, error: "Messages array cannot be empty." },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1];
    const userQuery = latestMessage?.content || "";

    // Check if an external LLM API key is provided in environment variables
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${userQuery}` }] },
              ],
            }),
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ success: true, message: reply });
          }
        }
      } catch (err) {
        console.warn("External Gemini API call failed, falling back to local engine:", err);
      }
    }

    if (openaiKey) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages.slice(-6),
            ],
            temperature: 0.6,
            max_tokens: 600,
          }),
        });
        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          const reply = openaiData.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ success: true, message: reply });
          }
        }
      } catch (err) {
        console.warn("External OpenAI API call failed, falling back to local engine:", err);
      }
    }

    // High-intelligence built-in knowledge response engine
    const reply = generateLocalKnowledgeResponse(userQuery);
    return NextResponse.json({ success: true, message: reply });
  } catch (error) {
    console.error("Mike Trades API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
