import { NextResponse } from "next/server";
import { HumidorReadingCreateSchema } from "@/lib/humidor-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { addHumidorReading, getHumidorReadings } from "@/lib/smartsheet";
import { loadHumidorReadings } from "@/lib/data";
import { createOwnedRecord, loadOwnedRecord } from "@/lib/user-data";
import { createServerRecordId } from "@/lib/server-record-id";
import type { HumidorReading } from "@/lib/types";
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
    const input = HumidorReadingCreateSchema.parse(await request.json());
    const {submissionId,...value}=input;
    const reading:HumidorReading={...value,readingId:createServerRecordId("reading",submissionId)};
    const created=await createOwnedRecord("readings",reading.readingId,reading);
    if(created==="exists"){const existing=await loadOwnedRecord<HumidorReading>("readings",reading.readingId);if(existing&&JSON.stringify(existing)===JSON.stringify(reading))return NextResponse.json({data:existing,retry:true});throw new Error("This submission was already used for a different climate reading")}
    if(created==="created")return NextResponse.json({data:reading},{status:201});
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(
      { data: await addHumidorReading(reading) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
