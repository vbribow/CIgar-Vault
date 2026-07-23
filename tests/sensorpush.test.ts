import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSensorPushSamples } from "../lib/sensorpush";
import type { EnvironmentalSensor } from "../lib/types";
const sensor:EnvironmentalSensor={sensorId:"SP-1",humidorId:"H1",provider:"SensorPush",name:"Cabinet",externalDeviceId:"123.456",syncMethod:"Cloud API",connectionStatus:"Ready"};
test("SensorPush samples normalize into provider-independent readings",()=>{const rows=normalizeSensorPushSamples({sensors:{"123.456":[{observed:"2026-07-21T12:00:00Z",temperature:68.2,humidity:66.4}]}},[sensor]);assert.equal(rows.length,1);assert.equal(rows[0].humidorId,"H1");assert.equal(rows[0].externalReadingId,"sensorpush:123.456:2026-07-21T12:00:00Z");});
test("unregistered SensorPush devices are ignored",()=>{const rows=normalizeSensorPushSamples({sensors:{unknown:[{observed:"2026-07-21T12:00:00Z",temperature:68,humidity:67}]}},[sensor]);assert.equal(rows.length,0);});
