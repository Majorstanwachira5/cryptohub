import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    const user = db.getUser();

    // Generate JWT-like session token
    const token = `jwt_quant_${Date.now()}_${Buffer.from(email || "trader@cryptohub.io").toString("base64")}`;

    return NextResponse.json({
      success: true,
      token,
      user: {
        ...user,
        email: email || user.email,
      },
      message: action === "signup" ? "Account created successfully" : "Logged in successfully",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "complete_risk_quiz") {
      const user = db.completeRiskQuiz();
      return NextResponse.json({ success: true, user });
    }
    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 400 });
  }
}
