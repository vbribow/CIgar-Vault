import { NextResponse } from "next/server";
import { dataMode } from "@/lib/config";
import { checkSmartsheet } from "@/lib/smartsheet";

export async function GET() {
  const mode = dataMode();
  if (mode === "mock") {
    return NextResponse.json({ ok: true, mode, connected: false, timestamp: new Date().toISOString() });
  }
  try {
    const connection = await checkSmartsheet();
    return NextResponse.json({ ...connection, mode, connected: connection.ok, timestamp: new Date().toISOString() }, { status: connection.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({ ok: false, mode, connected: false, error: error instanceof Error ? error.message : "Connection failed", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
