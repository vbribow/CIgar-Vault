import { requireEnv } from "./config";
import type { EnvironmentalSensor } from "./types";

const base="https://api.sensorpush.com/api/v1";
type SensorPushSample={observed:string;temperature?:number;humidity?:number};
type SampleResponse={sensors?:Record<string,SensorPushSample[]>;truncated?:boolean;total_samples?:number};

async function post<T>(path:string,body:unknown,token?:string):Promise<T>{
  const response=await fetch(`${base}${path}`,{method:"POST",headers:{accept:"application/json","content-type":"application/json",...(token?{Authorization:token}:{})},body:JSON.stringify(body),cache:"no-store"});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof result?.message==="string"?result.message:`SensorPush request failed (${response.status})`);
  return result as T;
}

export function normalizeSensorPushSamples(response:SampleResponse,registered:EnvironmentalSensor[]){
  const aliases=new Map<string,EnvironmentalSensor>();
  for(const sensor of registered)if(sensor.externalDeviceId)aliases.set(sensor.externalDeviceId,sensor);
  return Object.entries(response.sensors||{}).flatMap(([externalId,samples])=>{const sensor=aliases.get(externalId);if(!sensor)return[];return samples.flatMap(sample=>sample.observed&&sample.temperature!==undefined&&sample.humidity!==undefined?[{sensorId:sensor.sensorId,humidorId:sensor.humidorId,provider:"SensorPush",externalReadingId:`sensorpush:${externalId}:${sample.observed}`,recordedAt:sample.observed,temperatureF:sample.temperature,humidity:sample.humidity,source:"SensorPush cloud API"}]:[]);});
}

export async function fetchSensorPushReadings(registered:EnvironmentalSensor[]){
  const linked=registered.filter(sensor=>sensor.provider.toLowerCase()==="sensorpush"&&sensor.externalDeviceId);
  if(!linked.length)return{readings:[],linked:0,truncated:false};
  const email=requireEnv("SENSORPUSH_EMAIL");
  const password=requireEnv("SENSORPUSH_PASSWORD");
  const authorization=await post<{authorization:string}>("/oauth/authorize",{email,password});
  const access=await post<{accesstoken:string}>("/oauth/accesstoken",{authorization:authorization.authorization});
  const startTimes=linked.map(s=>s.lastSyncAt).filter((v):v is string=>Boolean(v));
  const startTime=startTimes.length?startTimes.sort()[0]:new Date(Date.now()-24*3_600_000).toISOString();
  const response=await post<SampleResponse>("/samples",{sensors:linked.map(s=>s.externalDeviceId),startTime,limit:5000,measures:["temperature","humidity"]},access.accesstoken);
  return{readings:normalizeSensorPushSamples(response,linked),linked:linked.length,truncated:Boolean(response.truncated)};
}
