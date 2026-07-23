import test from "node:test";
import assert from "node:assert/strict";
import { HumidorSchema,HumidorReadingSchema } from "../lib/humidor-model";
test("humidor accepts user-selected climate targets",()=>{const h=HumidorSchema.parse({humidorId:"HUM-1",name:"Main",targetTempF:68,minTempF:65,maxTempF:72,targetHumidity:67,minHumidity:62,maxHumidity:72,memberIds:[]});assert.equal(h.targetHumidity,67);});
test("humidor rejects a target outside its range",()=>{assert.throws(()=>HumidorSchema.parse({humidorId:"HUM-1",name:"Main",targetTempF:75,minTempF:65,maxTempF:72,targetHumidity:67,minHumidity:62,maxHumidity:72,memberIds:[]}));});
test("environmental reading validates temperature and humidity",()=>{const r=HumidorReadingSchema.parse({humidorId:"HUM-1",recordedAt:"2026-07-21T12:00",temperatureF:68.4,humidity:66.8});assert.equal(r.humidity,66.8);});
