import assert from "node:assert/strict";
import test from "node:test";
import { matchTempiSensor,parseTempiCsv } from "../lib/tempi-csv";

test("Tempi reports may include metadata before their real CSV header",()=>{
  const report=[
    "Temperature & Humidity Report",
    "Sensor Name: Small Cabinet [SN:F281BDF2F01B]",
    "Period: 05/03/26 3:42 PM - 08/10/26 3:42 PM",
    "Number of Readings: 2",
    "Time,Temperature (C),Temperature (F),Humidity",
    "05/03/26 3:42 PM,18.1,64.5,67.1",
    "05/03/26 3:43 PM,18.1,64.6,67.2",
  ].join("\n");
  const result=parseTempiCsv(report);
  assert.equal(result.totalReadings,2);
  assert.equal(result.sampleEvery,1);
  assert.equal(result.sensorName,"Small Cabinet");
  assert.equal(result.serialNumber,"F281BDF2F01B");
  assert.deepEqual(result.readings.map(({temperatureF,humidity})=>({temperatureF,humidity})),[
    {temperatureF:64.5,humidity:67.1},
    {temperatureF:64.6,humidity:67.2},
  ]);
  assert.match(result.readings[0].recordedAt,/2026-05-03T/);
});

test("multi-report imports match an exact embedded serial before a display name",()=>{
  const sensors=[
    {name:"Small Cabinet",externalDeviceId:"OTHER"},
    {name:"Earlier label",externalDeviceId:"F281BDF2F01B"},
  ];
  assert.equal(matchTempiSensor({sensorName:"Small Cabinet",serialNumber:"F281BDF2F01B"},sensors),sensors[1]);
});

test("oversized minute history is evenly reduced beneath the safe import limit",()=>{
  const rows=["Time,Temperature (F),Humidity"];
  for(let index=0;index<10_001;index++)rows.push(`2026-08-01T${String(Math.floor(index/60)%24).padStart(2,"0")}:${String(index%60).padStart(2,"0")}:00Z,70,65`);
  const result=parseTempiCsv(rows.join("\n"),5000);
  assert.equal(result.totalReadings,10_001);
  assert.equal(result.sampleEvery,3);
  assert.ok(result.readings.length<=5000);
});
