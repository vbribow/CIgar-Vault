import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { SensorCreateSchema, SensorSchema } from "@/lib/sensor-model";
import { getSensors, saveSensor } from "@/lib/smartsheet";
import { loadHumidorReadings, loadSensors } from "@/lib/data";
import { accountDataMode, createOwnedRecord, loadOwnedRecord, saveOwnedRecordsAtomically } from "@/lib/user-data";
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

export async function PATCH(request:Request){
  try{
    const sensor=SensorSchema.parse(await request.json());
    if(await accountDataMode()==="supabase"){
      const existing=await loadOwnedRecord<EnvironmentalSensor>("sensors",sensor.sensorId);
      if(!existing)return NextResponse.json({error:"Sensor not found"},{status:404});
      const readings=await loadHumidorReadings();
      const reassigned=readings
        .filter(reading=>reading.sensorId===sensor.sensorId&&reading.humidorId!==sensor.humidorId)
        .map(reading=>({...reading,humidorId:sensor.humidorId}));
      const saved=await saveOwnedRecordsAtomically([
        {kind:"sensors",recordId:sensor.sensorId,payload:sensor},
        ...reassigned.map(reading=>({kind:"readings" as const,recordId:reading.readingId,payload:reading})),
      ]);
      if(!saved)return NextResponse.json({error:"Sign in before updating a private sensor"},{status:401});
      return NextResponse.json({data:sensor,reassignedReadings:reassigned.length});
    }
    if(!authorizeWrite(request))return NextResponse.json({error:"Unauthorized"},{status:401});
    const existing=(await getSensors()).find(value=>value.sensorId===sensor.sensorId);
    if(!existing)return NextResponse.json({error:"Sensor not found"},{status:404});
    if(existing.humidorId!==sensor.humidorId)return NextResponse.json({error:"Move sensor history through a signed-in account before changing its humidor"},{status:409});
    await saveSensor(sensor);
    return NextResponse.json({data:sensor,reassignedReadings:0});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Invalid sensor update"},{status:422});
  }
}
