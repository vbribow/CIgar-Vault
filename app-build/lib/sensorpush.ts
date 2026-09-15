import { requireEnv } from "./config";
import type { EnvironmentalSensor } from "./types";

const base="https://api.sensorpush.com/api/v1";
type SensorPushSample={observed:string;temperature?:number;humidity?:number};
type SampleResponse={sensors?:Record<string,SensorPushSample[]>;truncated?:boolean;total_samples?:number};
export type SensorPushDevice={id?:string;deviceId?:string;name?:string;type?:string;active?:boolean};
type SensorResponse=Record<string,SensorPushDevice>;

async function post<T>(path:string,body:unknown,token?:string):Promise<T>{
  const response=await fetch(`${base}${path}`,{method:"POST",headers:{accept:"application/json","content-type":"application/json",...(token?{Authorization:token}:{})},body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(30_000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof result?.message==="string"?result.message:`SensorPush request failed (${response.status})`);
  return result as T;
}

export function sensorPushStartTime(registered:EnvironmentalSensor[],now=Date.now()){
  const initialLookback=new Date(now-12*3_600_000).toISOString();
  const cursors=registered.map(sensor=>sensor.lastSyncAt||initialLookback);
  return cursors.sort()[0]||initialLookback;
}

export function latestSensorPushCursors(readings:Array<{sensorId:string;recordedAt:string}>){
  const latest=new Map<string,string>();
  for(const reading of readings){
    const previous=latest.get(reading.sensorId);
    if(!previous||reading.recordedAt>previous)latest.set(reading.sensorId,reading.recordedAt);
  }
  return latest;
}

export function normalizeSensorPushSamples(response:SampleResponse,registered:EnvironmentalSensor[]){
  const aliases=new Map<string,EnvironmentalSensor>();
  for(const sensor of registered)if(sensor.externalDeviceId)aliases.set(sensor.externalDeviceId,sensor);
  return Object.entries(response.sensors||{}).flatMap(([externalId,samples])=>{const sensor=aliases.get(externalId);if(!sensor)return[];return samples.flatMap(sample=>{
    const timestamp=Date.parse(sample.observed);
    if(!Number.isFinite(timestamp)||sample.temperature===undefined||sample.humidity===undefined||!Number.isFinite(sample.temperature)||!Number.isFinite(sample.humidity)||sample.temperature< -100||sample.temperature>200||sample.humidity<0||sample.humidity>100)return[];
    return[{sensorId:sensor.sensorId,humidorId:sensor.humidorId,provider:"SensorPush",externalReadingId:`sensorpush:${externalId}:${sample.observed}`,recordedAt:new Date(timestamp).toISOString(),temperatureF:sample.temperature,humidity:sample.humidity,source:"SensorPush cloud API"}];
  });});
}

const identity=(value?:string)=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
export function resolveSensorPushDevices(registered:EnvironmentalSensor[],response:SensorResponse){
  const devices=Object.entries(response).map(([key,value])=>({key,value,longId:value.id||key}));
  const used=new Set<string>();
  return registered.map(sensor=>{
    const requested=identity(sensor.externalDeviceId),name=identity(sensor.name);
    const candidates=devices.filter(device=>!used.has(device.longId)&&((requested&&[device.key,device.value.id,device.value.deviceId].some(value=>identity(value)===requested))||(name&&identity(device.value.name)===name)));
    if(candidates.length!==1)return sensor;
    const match=candidates[0];used.add(match.longId);
    return{...sensor,externalDeviceId:match.longId,model:match.value.type||sensor.model};
  });
}

function devicesHaveId(response:SensorResponse,id?:string){return Boolean(id&&Object.entries(response).some(([key,value])=>(value.id||key)===id));}

export async function fetchSensorPushReadings(registered:EnvironmentalSensor[]){
  const linked=registered.filter(sensor=>sensor.provider.toLowerCase()==="sensorpush"&&sensor.externalDeviceId);
  if(!linked.length)return{readings:[],linked:0,truncated:false,cursors:new Map<string,string>()};
  const email=requireEnv("SENSORPUSH_EMAIL");
  const password=requireEnv("SENSORPUSH_PASSWORD");
  const authorization=await post<{authorization:string}>("/oauth/authorize",{email,password});
  const access=await post<{accesstoken:string}>("/oauth/accesstoken",{authorization:authorization.authorization});
  const inventory=await post<SensorResponse>("/devices/sensors",{},access.accesstoken);
  const resolved=resolveSensorPushDevices(linked,inventory);
  const matched=resolved.filter(sensor=>devicesHaveId(inventory,sensor.externalDeviceId));
  if(!matched.length)throw new Error("Hojavía could not match the registered sensor names or short IDs to this SensorPush account.");
  const startTime=sensorPushStartTime(matched);
  const response=await post<SampleResponse>("/samples",{sensors:matched.map(s=>s.externalDeviceId),startTime,limit:10000,measures:["temperature","humidity"]},access.accesstoken);
  const readings=normalizeSensorPushSamples(response,matched);
  return{readings,linked:matched.length,truncated:Boolean(response.truncated),cursors:latestSensorPushCursors(readings),resolvedSensors:matched};
}
