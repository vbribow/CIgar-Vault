import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { SensorSchema } from "@/lib/sensor-model";
import { getSensors, saveSensor } from "@/lib/smartsheet";
import { loadSensors } from "@/lib/data";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadSensors() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const sensor = SensorSchema.parse(await request.json());
    if (await saveOwnedRecord("sensors",sensor.sensorId,sensor)) return NextResponse.json({ data: sensor }, { status: 201 });
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await saveSensor(sensor);
    return NextResponse.json({ data: sensor }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
