import { SensorSchema } from "./sensor-model";
import type { EnvironmentalSensor } from "./types";

export type OwnedSensorAccount={userId:string;sensors:EnvironmentalSensor[]};

export function sensorPushAccountOwners(rows:Array<{user_id:string;payload:unknown}>,configuredUserId?:string):OwnedSensorAccount[]{
  const grouped=new Map<string,EnvironmentalSensor[]>();
  for(const row of rows){
    const parsed=SensorSchema.safeParse(row.payload);
    if(!parsed.success||parsed.data.provider.toLowerCase()!=="sensorpush"||!parsed.data.externalDeviceId)continue;
    if(configuredUserId&&row.user_id!==configuredUserId)continue;
    grouped.set(row.user_id,[...(grouped.get(row.user_id)||[]),parsed.data]);
  }
  return[...grouped].map(([userId,sensors])=>({userId,sensors}));
}

export function scheduledSensorPushOwner(accounts:OwnedSensorAccount[],configuredUserId?:string):OwnedSensorAccount{
  if(configuredUserId){
    const owner=accounts.find(account=>account.userId===configuredUserId);
    if(!owner)throw new Error("SENSORPUSH_ACCOUNT_USER_ID does not match an account with linked SensorPush devices");
    return owner;
  }
  if(accounts.length===1)return accounts[0];
  if(!accounts.length)throw new Error("No private account has linked SensorPush devices");
  throw new Error("Multiple accounts have SensorPush devices; set SENSORPUSH_ACCOUNT_USER_ID so scheduled sync fails closed");
}
