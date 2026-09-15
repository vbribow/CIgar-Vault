import { NextResponse } from "next/server";
import { authorizeSensorSync,dataMode } from "@/lib/config";
import { fetchSensorPushReadings } from "@/lib/sensorpush";
import { getSensors,ingestSensorReadings,saveSensor } from "@/lib/smartsheet";
import { processClimateAlertNotifications } from "@/lib/alert-notifications";
import { loadHumidorReadings,loadSensors } from "@/lib/data";
import { accountDataMode,saveOwnedRecordsAtomically } from "@/lib/user-data";
import { uniqueSensorReadings } from "@/lib/sensor-model";

async function sync(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  if(dataMode()==="mock")return NextResponse.json({data:{provider:"SensorPush",linked:0,imported:0,duplicates:0,message:"Cloud sync is disabled in mock mode"}});
  const accountOwned=await accountDataMode()==="supabase";
  const sensors=accountOwned?await loadSensors():await getSensors();
  const sensorPush=sensors.filter(sensor=>sensor.provider.toLowerCase()==="sensorpush");
  try{
    const result=await fetchSensorPushReadings(sensorPush);
    if(!result.linked)return NextResponse.json({error:"Register a SensorPush device and add its external device ID first"},{status:422});
    let ingested:{imported:number;duplicates:number};
    const syncedAt=new Date().toISOString();
    const resolvedById=new Map((result.resolvedSensors||sensorPush).map(sensor=>[sensor.sensorId,sensor]));
    const updatedSensors=sensorPush.map(original=>{const sensor=resolvedById.get(original.sensorId)||original;
      const cursor=result.cursors.get(sensor.sensorId);
      return{...sensor,lastSyncAt:cursor||sensor.lastSyncAt,connectionStatus:cursor?(result.truncated?"Stale" as const:"Connected" as const):"Stale" as const,syncMethod:"Cloud API" as const};
    });
    if(accountOwned){
      const existing=await loadHumidorReadings();
      const existingIds=existing.flatMap(reading=>reading.externalReadingId?[reading.externalReadingId]:[]);
      const{unique,duplicates}=uniqueSensorReadings(result.readings,existingIds);
      const importedAt=new Date().toISOString();
      await saveOwnedRecordsAtomically([
        ...unique.map(reading=>{const payload={...reading,readingId:`READ-${crypto.randomUUID()}`,importedAt};return{kind:"readings" as const,recordId:payload.readingId,payload}}),
        ...updatedSensors.map(sensor=>({kind:"sensors" as const,recordId:sensor.sensorId,payload:sensor})),
      ]);
      ingested={imported:unique.length,duplicates};
    }else{
      ingested=result.readings.length?await ingestSensorReadings(result.readings):{imported:0,duplicates:0};
      for(const sensor of updatedSensors)await saveSensor(sensor);
    }
    const notifications=accountOwned?{enabled:false,sent:0,skipped:0,retried:0}:await processClimateAlertNotifications();
    return NextResponse.json({data:{provider:"SensorPush",linked:result.linked,...ingested,truncated:result.truncated,syncedAt,notifications,message:result.truncated?"SensorPush limited this batch. Saved progress is safe; wait at least one minute, then sync again to continue.":"All available SensorPush readings are current."}});
  }catch(error){
    if(!accountOwned)await Promise.all(sensorPush.map(sensor=>saveSensor({...sensor,connectionStatus:"Error",syncMethod:"Cloud API"}).catch(()=>undefined)));
    throw error;
  }
}
export async function GET(request:Request){try{return await sync(request)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sensor sync failed"},{status:502})}}
export async function POST(request:Request){try{return await sync(request)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sensor sync failed"},{status:502})}}
