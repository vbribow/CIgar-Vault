import test from "node:test";
import assert from "node:assert/strict";
import { humidorInsights } from "../lib/humidor-insights";
import type { Humidor,HumidorReading } from "../lib/types";
const humidor:Humidor={humidorId:"H1",name:"Main",targetTempF:68,minTempF:65,maxTempF:72,targetHumidity:67,minHumidity:62,maxHumidity:72};
const readings:HumidorReading[]=[{readingId:"R1",humidorId:"H1",recordedAt:"2026-07-20",temperatureF:68,humidity:67},{readingId:"R2",humidorId:"H1",recordedAt:"2026-07-21",temperatureF:74,humidity:67}];
test("humidor insights calculate stability and excursions",()=>{const result=humidorInsights(humidor,readings);assert.equal(result.stability,50);assert.equal(result.excursions.length,1);assert.equal(result.latest?.readingId,"R2");});
test("humidor insights remain safe with a long sensor history",()=>{const history=Array.from({length:150_000},(_,index)=>({...readings[0],readingId:`R-${index}`,recordedAt:new Date(Date.UTC(2026,0,1,0,index)).toISOString()}));const result=humidorInsights(humidor,history);assert.equal(result.rows.length,150_000);assert.equal(result.stability,100);assert.equal(result.minHumidity,67);assert.equal(result.maxTemp,68)});
