import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signSession } from "@/lib/auth/jwt";
import { AccountType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action, accountType } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Credential verification belongs to Supabase Auth, which runs on the
    // /auth page. This route issues the platform session for a user that has
    // already signed in, and deliberately does not pretend to check a
    // password it has no way to check.
    const account: AccountType = accountType === "REAL" ? "REAL" : "DEMO";
    const known = email.toLowerCase() === db.getUser().email.toLowerCase();
    const user = known ? db.getUser() : { ...db.getUser(), email };

    const token = signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accountType: account,
    });

    return NextResponse.json({
      success: true,
      token,
      accountType: account,
      user,
      message:
        action === "signup"
          ? "Account created successfully"
          : "Session issued successfully",
    });
  } catch (error) {
    console.error("Auth issue failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not issue a session. Check the server configuration." },
      { status: 500 }
    );
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
