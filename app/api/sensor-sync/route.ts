import { NextResponse } from "next/server";
import { authorizeSensorSync,dataMode } from "@/lib/config";
import { fetchSensorPushReadings } from "@/lib/sensorpush";
import { getSensors,ingestSensorReadings,saveSensor } from "@/lib/smartsheet";
import { processClimateAlertNotifications } from "@/lib/alert-notifications";

async function sync(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  if(dataMode()==="mock")return NextResponse.json({data:{provider:"SensorPush",linked:0,imported:0,duplicates:0,message:"Cloud sync is disabled in mock mode"}});
  const sensors=await getSensors();
  const sensorPush=sensors.filter(sensor=>sensor.provider.toLowerCase()==="sensorpush");
  try{
    const result=await fetchSensorPushReadings(sensorPush);
    if(!result.linked)return NextResponse.json({error:"Register a SensorPush device and add its external device ID first"},{status:422});
    const ingested=result.readings.length?await ingestSensorReadings(result.readings):{imported:0,duplicates:0};
    const syncedAt=new Date().toISOString();
    for(const sensor of sensorPush){
      const cursor=result.cursors.get(sensor.sensorId);
      await saveSensor({...sensor,lastSyncAt:cursor||sensor.lastSyncAt,connectionStatus:cursor?(result.truncated?"Stale":"Connected"):"Stale",syncMethod:"Cloud API"});
    }
    const notifications=await processClimateAlertNotifications();
    return NextResponse.json({data:{provider:"SensorPush",linked:result.linked,...ingested,truncated:result.truncated,syncedAt,notifications,message:result.truncated?"SensorPush limited this batch. Saved progress is safe; wait at least one minute, then sync again to continue.":"All available SensorPush readings are current."}});
  }catch(error){
    await Promise.all(sensorPush.map(sensor=>saveSensor({...sensor,connectionStatus:"Error",syncMethod:"Cloud API"}).catch(()=>undefined)));
    throw error;
  }
}
export async function GET(request:Request){try{return await sync(request)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sensor sync failed"},{status:502})}}
export async function POST(request:Request){try{return await sync(request)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sensor sync failed"},{status:502})}}
