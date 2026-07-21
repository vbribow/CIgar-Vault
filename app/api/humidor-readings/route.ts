import { NextResponse } from "next/server";
import { HumidorReadingSchema } from "@/lib/humidor-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { addHumidorReading, getHumidorReadings } from "@/lib/smartsheet";
import { loadHumidorReadings } from "@/lib/data";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadHumidorReadings() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const value = HumidorReadingSchema.parse(await request.json());
    const reading={...value,readingId:`READ-${crypto.randomUUID()}`};
    if(await saveOwnedRecord("readings",reading.readingId,reading))return NextResponse.json({data:reading},{status:201});
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(
      { data: await addHumidorReading(value) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
