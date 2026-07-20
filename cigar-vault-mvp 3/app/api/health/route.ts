import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, mode: process.env.USE_MOCK_DATA === "true" ? "mock" : "smartsheet", timestamp: new Date().toISOString() });
}
