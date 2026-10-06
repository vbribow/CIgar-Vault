import { NextResponse } from "next/server";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { authorizeSensorSync,dataMode } from "@/lib/config";
import { fetchSensorPushReadings } from "@/lib/sensorpush";
import { getSensors,ingestSensorReadings,saveSensor } from "@/lib/smartsheet";
import { processClimateAlertNotifications } from "@/lib/alert-notifications";
import { loadHumidorReadings,loadSensors } from "@/lib/data";
import { accountDataMode,saveOwnedRecord,saveOwnedRecordsAtomically } from "@/lib/user-data";
import { uniqueSensorReadings } from "@/lib/sensor-model";
import { scheduledSensorPushOwner,sensorPushAccountOwners } from "@/lib/sensor-sync-ownership";
import type { EnvironmentalSensor,HumidorReading } from "@/lib/types";
import type { SystemRun } from "@/lib/system-health";

export const maxDuration=60;

type SyncResult={provider:"SensorPush";linked:number;imported:number;duplicates:number;truncated:boolean;syncedAt:string;notifications:{enabled:boolean;sent:number;skipped:number;retried:number};message:string};
type VaultRow={user_id:string;record_id:string;payload:unknown};

const runRecord=(startedAt:string,status:SystemRun["status"],summary:string,error?:string):SystemRun=>{const completedAt=new Date().toISOString();return{runId:`RUN-sensor-sync-${completedAt}-${crypto.randomUUID()}`,jobId:"sensor-sync",status,startedAt,completedAt,summary,error}};
const scheduledRequest=(request:Request)=>{const secret=process.env.CRON_SECRET?.trim();return Boolean(secret&&request.headers.get("authorization")===`Bearer ${secret}`)};
const admin=():SupabaseClient=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Scheduled SensorPush sync requires Supabase service credentials");return createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};

async function syncReadings(sensors:EnvironmentalSensor[],existing:HumidorReading[]){
  const result=await fetchSensorPushReadings(sensors);
  if(!result.linked)throw new Error("Register a SensorPush device and add its external device ID first");
  const existingIds=existing.flatMap(reading=>reading.externalReadingId?[reading.externalReadingId]:[]);
  const{unique,duplicates}=uniqueSensorReadings(result.readings,existingIds);
  const importedAt=new Date().toISOString(),syncedAt=new Date().toISOString();
  const resolvedById=new Map((result.resolvedSensors||sensors).map(sensor=>[sensor.sensorId,sensor]));
  const updatedSensors=sensors.map(original=>{const sensor=resolvedById.get(original.sensorId)||original,cursor=result.cursors.get(sensor.sensorId);return{...sensor,lastSyncAt:cursor||sensor.lastSyncAt,connectionStatus:cursor?(result.truncated?"Stale" as const:"Connected" as const):"Stale" as const,syncMethod:"Cloud API" as const}});
  const readings=unique.map(reading=>({...reading,readingId:`READ-${crypto.randomUUID()}`,importedAt}));
  const message=result.truncated?"SensorPush limited this batch. Saved progress is safe; the next hourly run will continue automatically.":readings.length||duplicates?"All available SensorPush readings are current.":"SensorPush connected, but returned no readings in the current import window.";
  const data:SyncResult={provider:"SensorPush",linked:result.linked,imported:readings.length,duplicates,truncated:result.truncated,syncedAt,notifications:{enabled:false,sent:0,skipped:0,retried:0},message};
  return{data,readings,updatedSensors};
}

async function syncSignedInAccount(startedAt:string){
  const sensors=(await loadSensors()).filter(sensor=>sensor.provider.toLowerCase()==="sensorpush");
  const result=await syncReadings(sensors,await loadHumidorReadings());
  const run=runRecord(startedAt,"Succeeded",`${result.data.imported} readings imported · ${result.data.duplicates} duplicates · ${result.data.linked} sensors linked`);
  const saved=await saveOwnedRecordsAtomically([
    ...result.readings.map(reading=>({kind:"readings" as const,recordId:reading.readingId,payload:reading})),
    ...result.updatedSensors.map(sensor=>({kind:"sensors" as const,recordId:sensor.sensorId,payload:sensor})),
    {kind:"system-runs" as const,recordId:run.runId,payload:run},
  ]);
  if(!saved)throw new Error("The signed-in account could not be resolved while saving SensorPush readings");
  return result.data;
}

async function syncScheduledAccount(startedAt:string){
  const client=admin();
  const{data:sensorRows,error:sensorError}=await client.from("vault_records").select("user_id,record_id,payload").eq("kind","sensors").limit(5000);
  if(sensorError)throw sensorError;
  const configuredUserId=process.env.SENSORPUSH_ACCOUNT_USER_ID?.trim();
  const owner=scheduledSensorPushOwner(sensorPushAccountOwners((sensorRows||[]) as VaultRow[],configuredUserId),configuredUserId);
  try{
    const{data:readingRows,error:readingError}=await client.from("vault_records").select("user_id,record_id,payload").eq("user_id",owner.userId).eq("kind","readings").limit(10000);
    if(readingError)throw readingError;
    const existing=(readingRows||[]).flatMap(row=>{const value=row.payload as Partial<HumidorReading>|null;return value&&typeof value.readingId==="string"&&typeof value.recordedAt==="string"?[value as HumidorReading]:[]});
    const result=await syncReadings(owner.sensors,existing);
    const run=runRecord(startedAt,"Succeeded",`${result.data.imported} readings imported · ${result.data.duplicates} duplicates · ${result.data.linked} sensors linked`);
    const rows=[
      ...result.readings.map(reading=>({user_id:owner.userId,kind:"readings",record_id:reading.readingId,payload:reading,updated_at:result.data.syncedAt})),
      ...result.updatedSensors.map(sensor=>({user_id:owner.userId,kind:"sensors",record_id:sensor.sensorId,payload:sensor,updated_at:result.data.syncedAt})),
      {user_id:owner.userId,kind:"system-runs",record_id:run.runId,payload:run,updated_at:run.completedAt},
    ];
    const{error:saveError}=await client.from("vault_records").upsert(rows,{onConflict:"user_id,kind,record_id"});
    if(saveError)throw saveError;
    return result.data;
  }catch(error){
    const message=error instanceof Error?error.message:"Sensor sync failed";
    const run=runRecord(startedAt,"Failed","Sensor synchronization failed",message);
    await client.from("vault_records").upsert({user_id:owner.userId,kind:"system-runs",record_id:run.runId,payload:run,updated_at:run.completedAt},{onConflict:"user_id,kind,record_id"});
    throw error;
  }
}

async function syncLegacySmartsheet(){
  const sensors=(await getSensors()).filter(sensor=>sensor.provider.toLowerCase()==="sensorpush");
  const result=await fetchSensorPushReadings(sensors);
  if(!result.linked)throw new Error("Register a SensorPush device and add its external device ID first");
  const ingested=result.readings.length?await ingestSensorReadings(result.readings):{imported:0,duplicates:0};
  const syncedAt=new Date().toISOString();
  for(const sensor of sensors){const cursor=result.cursors.get(sensor.sensorId);await saveSensor({...sensor,lastSyncAt:cursor||sensor.lastSyncAt,connectionStatus:cursor?(result.truncated?"Stale":"Connected"):"Stale",syncMethod:"Cloud API"})}
  const notifications=await processClimateAlertNotifications();
  return{provider:"SensorPush" as const,linked:result.linked,...ingested,truncated:result.truncated,syncedAt,notifications,message:result.truncated?"SensorPush limited this batch. Saved progress is safe; the next hourly run will continue automatically.":"All available SensorPush readings are current."};
}

async function sync(request:Request){
  const startedAt=new Date().toISOString();
  if(dataMode()==="mock")return NextResponse.json({data:{provider:"SensorPush",linked:0,imported:0,duplicates:0,message:"Cloud sync is disabled in mock mode"}});
  const accountOwned=await accountDataMode()==="supabase";
  if(!accountOwned&&!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const data=accountOwned?await syncSignedInAccount(startedAt):scheduledRequest(request)?await syncScheduledAccount(startedAt):await syncLegacySmartsheet();
    return NextResponse.json({data});
  }catch(error){
    const message=error instanceof Error?error.message:"Sensor sync failed";
    if(accountOwned){const run=runRecord(startedAt,"Failed","Sensor synchronization failed",message);await saveOwnedRecord("system-runs",run.runId,run).catch(()=>false)}
    return NextResponse.json({error:message},{status:502});
  }
}
export async function GET(request:Request){return sync(request)}
export async function POST(request:Request){return sync(request)}
