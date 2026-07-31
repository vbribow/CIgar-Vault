import test from "node:test";
import assert from "node:assert/strict";
import { climateIntelligence,climateProfile } from "../lib/climate-intelligence";
import type { Humidor,HumidorReading } from "../lib/types";

const humidor:Humidor={humidorId:"H1",name:"Habanos Cabinet",climateProfile:"habanos",targetTempF:63,minTempF:61,maxTempF:64,targetHumidity:67,minHumidity:65,maxHumidity:70};
const reading=(id:string,recordedAt:string,temperatureF:number,humidity:number):HumidorReading=>({readingId:id,humidorId:"H1",recordedAt,temperatureF,humidity});

test("climate profiles preserve distinct Habanos and New World standards",()=>{
  const habanos=climateProfile("habanos");
  const newWorld=climateProfile("new-world");
  assert.deepEqual([habanos.minTempF,habanos.maxTempF,habanos.minHumidity,habanos.maxHumidity],[61,64,65,70]);
  assert.deepEqual([newWorld.minTempF,newWorld.maxTempF,newWorld.minHumidity,newWorld.maxHumidity],[65,70,65,69]);
});

test("one out-of-range sample remains a brief excursion",()=>{
  const result=climateIntelligence(humidor,[reading("R1","2026-07-24T11:00:00Z",66,67)],new Date("2026-07-24T12:00:00Z"));
  assert.equal(result.state,"Brief excursion");
  assert.equal(result.sustained,false);
  assert.match(result.summary,/1 observed reading/);
  assert.match(result.action||"",/lower room temperature/i);
});

test("repeated warm and humid readings become sustained exposure",()=>{
  const readings=[
    reading("R1","2026-07-23T06:00:00Z",68,73),
    reading("R2","2026-07-23T18:00:00Z",68,74),
    reading("R3","2026-07-24T06:00:00Z",69,74),
  ];
  const result=climateIntelligence(humidor,readings,new Date("2026-07-24T08:00:00Z"));
  assert.equal(result.state,"Sustained exposure");
  assert.equal(result.primaryKind,"warm-humid");
  assert.equal(result.consecutiveReadings,3);
  assert.ok(result.exposureHours.warmHumid>0);
  assert.match(result.consequence||"",/mold/);
  assert.match(result.consequence||"",/tobacco-beetle/);
});

test("stable readings produce no corrective action",()=>{
  const result=climateIntelligence(humidor,[reading("R1","2026-07-24T11:00:00Z",63,67)],new Date("2026-07-24T12:00:00Z"));
  assert.equal(result.state,"Stable");
  assert.equal(result.action,undefined);
  assert.match(result.summary,/inside the collector-selected/);
});
