import type { Humidor,HumidorReading } from "./types";

export function humidorInsights(humidor:Humidor,readings:HumidorReading[]){
  const rows=readings.filter(reading=>reading.humidorId===humidor.humidorId).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt));
  const inRange=(reading:HumidorReading)=>reading.temperatureF>=humidor.minTempF&&reading.temperatureF<=humidor.maxTempF&&reading.humidity>=humidor.minHumidity&&reading.humidity<=humidor.maxHumidity;
  const totals=rows.reduce((result,reading)=>({
    stable:result.stable+(inRange(reading)?1:0),
    temp:result.temp+reading.temperatureF,
    humidity:result.humidity+reading.humidity,
    minTemp:Math.min(result.minTemp,reading.temperatureF),
    maxTemp:Math.max(result.maxTemp,reading.temperatureF),
    minHumidity:Math.min(result.minHumidity,reading.humidity),
    maxHumidity:Math.max(result.maxHumidity,reading.humidity),
  }),{stable:0,temp:0,humidity:0,minTemp:Infinity,maxTemp:-Infinity,minHumidity:Infinity,maxHumidity:-Infinity});
  return{
    rows,
    latest:rows[0],
    stableCount:totals.stable,
    stability:rows.length?Math.round(totals.stable/rows.length*100):undefined,
    averageTemp:rows.length?totals.temp/rows.length:undefined,
    averageHumidity:rows.length?totals.humidity/rows.length:undefined,
    minTemp:rows.length?totals.minTemp:undefined,
    maxTemp:rows.length?totals.maxTemp:undefined,
    minHumidity:rows.length?totals.minHumidity:undefined,
    maxHumidity:rows.length?totals.maxHumidity:undefined,
    excursions:rows.filter(reading=>!inRange(reading)),
  };
}
