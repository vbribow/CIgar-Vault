import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { SensorCreateSchema } from "@/lib/sensor-model";
import { getSensors, saveSensor } from "@/lib/smartsheet";
import { loadSensors } from "@/lib/data";
import { createOwnedRecord, loadOwnedRecord } from "@/lib/user-data";
import { createServerRecordId } from "@/lib/server-record-id";
import type { EnvironmentalSensor } from "@/lib/types";
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
    const input = SensorCreateSchema.parse(await request.json());
    const {submissionId,...fields}=input;
    const sensor:EnvironmentalSensor={sensorId:createServerRecordId("sensor",submissionId),...fields};
    const created=await createOwnedRecord("sensors",sensor.sensorId,sensor);
    if(created==="exists"){const existing=await loadOwnedRecord<EnvironmentalSensor>("sensors",sensor.sensorId);if(existing&&JSON.stringify(existing)===JSON.stringify(sensor))return NextResponse.json({data:existing,retry:true});throw new Error("This submission was already used for a different sensor")}
    if (created==="created") return NextResponse.json({ data: sensor }, { status: 201 });
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const existing=(await getSensors()).find(value=>value.sensorId===sensor.sensorId);
    if(existing)return JSON.stringify(existing)===JSON.stringify(sensor)?NextResponse.json({data:existing,retry:true}):NextResponse.json({error:"This submission was already used for a different sensor"},{status:409});
    await saveSensor(sensor);
    return NextResponse.json({ data: sensor }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
