import test from "node:test";
import assert from "node:assert/strict";
import { scheduledSensorPushOwner,sensorPushAccountOwners } from "../lib/sensor-sync-ownership";

const sensor=(sensorId:string)=>({sensorId,humidorId:"H-1",provider:"SensorPush",name:sensorId,externalDeviceId:`external-${sensorId}`,syncMethod:"Cloud API",connectionStatus:"Connected"});

test("scheduled SensorPush sync discovers the sole private account owner",()=>{
  const accounts=sensorPushAccountOwners([{user_id:"owner-1",payload:sensor("SP-1")},{user_id:"owner-1",payload:sensor("SP-2")},{user_id:"owner-2",payload:{...sensor("TEMPI-1"),provider:"Tempi"}}]);
  assert.equal(accounts.length,1);
  assert.equal(scheduledSensorPushOwner(accounts).userId,"owner-1");
  assert.equal(accounts[0].sensors.length,2);
});

test("scheduled SensorPush sync fails closed when global credentials could target multiple accounts",()=>{
  const accounts=sensorPushAccountOwners([{user_id:"owner-1",payload:sensor("SP-1")},{user_id:"owner-2",payload:sensor("SP-2")}]);
  assert.throws(()=>scheduledSensorPushOwner(accounts),/Multiple accounts/);
  assert.equal(scheduledSensorPushOwner(accounts,"owner-2").userId,"owner-2");
});

test("configured owner must have a linked SensorPush device",()=>{
  const accounts=sensorPushAccountOwners([{user_id:"owner-1",payload:sensor("SP-1")}],"missing-owner");
  assert.throws(()=>scheduledSensorPushOwner(accounts,"missing-owner"),/does not match/);
});
