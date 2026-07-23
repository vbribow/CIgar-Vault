import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { getActivities,getCollections,getHumidorReadings,getHumidors,getInventory,getSensors,getSmokingLogs,getValuations } from "@/lib/smartsheet";
import { importOwnedRecords, type VaultRecordKind } from "@/lib/user-data";

export async function POST(request:Request){
  if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});
  try{
    const[inventory,collections,humidors,readings,sensors,valuations,smokes,activities]=await Promise.all([getInventory(),getCollections(),getHumidors(),getHumidorReadings(),getSensors(),getValuations(),getSmokingLogs(),getActivities()]);
    const groups:Array<[VaultRecordKind,unknown[],string]>=[["inventory",inventory,"inventoryId"],["collections",collections,"collectionId"],["humidors",humidors,"humidorId"],["readings",readings,"readingId"],["sensors",sensors,"sensorId"],["valuations",valuations,"valuationId"],["smokes",smokes,"smokeId"],["activities",activities,"activityId"]];
    const records=groups.flatMap(([kind,items,id])=>items.map(payload=>({kind,recordId:String((payload as Record<string,unknown>)[id]),payload})));
    return NextResponse.json({data:{imported:await importOwnedRecords(records),groups:Object.fromEntries(groups.map(([kind,items])=>[kind,items.length]))}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Import failed"},{status:502});}
}
