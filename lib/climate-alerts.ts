import type { EnvironmentalSensor,Humidor,HumidorReading,InventoryItem } from "./types";

export type ClimateSeverity="Good"|"Attention"|"Critical"|"Offline";
export type ClimateAlert={id:string;humidorId:string;severity:Exclude<ClimateSeverity,"Good">;kind:"Temperature"|"Humidity"|"Battery"|"Sensor";message:string;recordedAt?:string};

const ageHours=(iso:string|undefined,now:Date)=>iso?Math.max(0,(now.getTime()-new Date(iso).getTime())/3_600_000):Infinity;
const money=(items:InventoryItem[],humidorId:string)=>items.filter(i=>i.storageLocationId===humidorId).reduce((sum,i)=>sum+(i.retailValue??0)*(i.currentQty??0),0);

export function climateHealth(humidor:Humidor,readings:HumidorReading[],sensors:EnvironmentalSensor[],inventory:InventoryItem[],now=new Date()){
  const rows=readings.filter(r=>r.humidorId===humidor.humidorId).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt));
  const devices=sensors.filter(s=>s.humidorId===humidor.humidorId);
  const latest=rows[0];
  const sensor=devices.find(s=>s.sensorId===latest?.sensorId)||devices[0];
  const hoursSinceReading=ageHours(latest?.recordedAt,now);
  const alerts:ClimateAlert[]=[];
  if(!latest||hoursSinceReading>24)alerts.push({id:`${humidor.humidorId}-offline`,humidorId:humidor.humidorId,severity:"Offline",kind:"Sensor",message:latest?`No reading received for ${Math.floor(hoursSinceReading)} hours`:"No climate reading has been received" ,recordedAt:latest?.recordedAt});
  else if(hoursSinceReading>6)alerts.push({id:`${humidor.humidorId}-stale`,humidorId:humidor.humidorId,severity:"Attention",kind:"Sensor",message:`Latest reading is ${Math.floor(hoursSinceReading)} hours old`,recordedAt:latest.recordedAt});
  const battery=latest?.batteryPercent??sensor?.batteryPercent;
  if(battery!==undefined&&battery<=20)alerts.push({id:`${humidor.humidorId}-battery`,humidorId:humidor.humidorId,severity:battery<=10?"Critical":"Attention",kind:"Battery",message:`Sensor battery is ${battery}%`,recordedAt:latest?.recordedAt});
  if(latest){
    if(latest.temperatureF<humidor.minTempF||latest.temperatureF>humidor.maxTempF){const gap=latest.temperatureF<humidor.minTempF?humidor.minTempF-latest.temperatureF:latest.temperatureF-humidor.maxTempF;alerts.push({id:`${humidor.humidorId}-temperature`,humidorId:humidor.humidorId,severity:gap>3?"Critical":"Attention",kind:"Temperature",message:`${latest.temperatureF}°F is outside ${humidor.minTempF}–${humidor.maxTempF}°F`,recordedAt:latest.recordedAt});}
    if(latest.humidity<humidor.minHumidity||latest.humidity>humidor.maxHumidity){const gap=latest.humidity<humidor.minHumidity?humidor.minHumidity-latest.humidity:latest.humidity-humidor.maxHumidity;alerts.push({id:`${humidor.humidorId}-humidity`,humidorId:humidor.humidorId,severity:gap>5?"Critical":"Attention",kind:"Humidity",message:`${latest.humidity}% RH is outside ${humidor.minHumidity}–${humidor.maxHumidity}%`,recordedAt:latest.recordedAt});}
  }
  const severity:ClimateSeverity=alerts.some(a=>a.severity==="Critical")?"Critical":alerts.some(a=>a.severity==="Offline")?"Offline":alerts.length?"Attention":"Good";
  const storedValue=money(inventory,humidor.humidorId);
  return{humidor,latest,sensor,rows,alerts,severity,hoursSinceReading,battery,storedValue,valueAtRisk:severity==="Attention"||severity==="Critical"?storedValue:0,unmonitoredValue:severity==="Offline"?storedValue:0};
}

export function historicalClimateAlerts(humidors:Humidor[],readings:HumidorReading[],limit=20):ClimateAlert[]{
  const byId=new Map(humidors.map(h=>[h.humidorId,h]));
  return readings.flatMap(r=>{const h=byId.get(r.humidorId);if(!h)return[];const result:ClimateAlert[]=[];if(r.temperatureF<h.minTempF||r.temperatureF>h.maxTempF)result.push({id:`${r.readingId}-temperature`,humidorId:r.humidorId,severity:r.temperatureF<h.minTempF-3||r.temperatureF>h.maxTempF+3?"Critical":"Attention",kind:"Temperature",message:`${r.temperatureF}°F recorded outside ${h.minTempF}–${h.maxTempF}°F`,recordedAt:r.recordedAt});if(r.humidity<h.minHumidity||r.humidity>h.maxHumidity)result.push({id:`${r.readingId}-humidity`,humidorId:r.humidorId,severity:r.humidity<h.minHumidity-5||r.humidity>h.maxHumidity+5?"Critical":"Attention",kind:"Humidity",message:`${r.humidity}% RH recorded outside ${h.minHumidity}–${h.maxHumidity}%`,recordedAt:r.recordedAt});return result;}).sort((a,b)=>(b.recordedAt||"").localeCompare(a.recordedAt||"")).slice(0,limit);
}
