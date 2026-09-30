import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const stats = db.getAdminStats();
  const trades = db.getTrades();
  const user = db.getUser();
  const balance = db.getBalance();
  return NextResponse.json({ stats, trades, user, balance });
}
