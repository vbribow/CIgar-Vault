import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SensorIngestSchema,SensorSchema,uniqueSensorReadings } from "../lib/sensor-model";
test("Tempi sensor supports CSV synchronization",()=>{const sensor=SensorSchema.parse({sensorId:"TEMPI-1",humidorId:"HUM-1",provider:"Tempi",model:"T3",name:"Main Tempi",syncMethod:"CSV import",connectionStatus:"Ready"});assert.equal(sensor.provider,"Tempi");});
test("normalized sensor ingestion requires a stable external reading id",()=>{assert.throws(()=>SensorIngestSchema.parse({readings:[{sensorId:"S1",humidorId:"H1",provider:"Tempi",recordedAt:"2026-07-21T12:00",temperatureF:68,humidity:67}]}));});
test("duplicate readings in one gateway batch are written only once",()=>{const values=[{externalReadingId:"SP:1"},{externalReadingId:"SP:1"},{externalReadingId:"SP:2"}];assert.deepEqual(uniqueSensorReadings(values,new Set(["SP:2"])),{unique:[values[0]],duplicates:2});});
test("signed-in collectors import climate readings without a founder key",()=>{
  const route=readFileSync(new URL("../app/api/sensor-ingest/route.ts",import.meta.url),"utf8");
  assert.match(route,/accountDataMode\(\) === "supabase"/);
  assert.match(route,/loadHumidorReadings\(\)/);
  assert.match(route,/saveOwnedRecordsAtomically/);
  assert.match(route,/kind: "readings"/);
  assert.match(route,/kind: "sensors"/);
  assert.ok(route.indexOf('accountDataMode() === "supabase"')<route.indexOf("authorizeWrite(request)"));
});
