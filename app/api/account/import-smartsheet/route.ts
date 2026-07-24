import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { getActivities,getCollections,getHumidorReadings,getHumidors,getInventory,getSensors,getSmokingLogs,getValuations } from "@/lib/smartsheet";
import { importOwnedRecords, loadAccountRecords, type VaultRecordKind } from "@/lib/user-data";
import { planAdditiveSmartsheetMigration } from "@/lib/smartsheet-migration";

export async function POST(request:Request){
  if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});
  try{
    const[inventory,collections,humidors,readings,sensors,valuations,smokes,activities]=await Promise.all([getInventory(),getCollections(),getHumidors(),getHumidorReadings(),getSensors(),getValuations(),getSmokingLogs(),getActivities()]);
    const groups:Array<[VaultRecordKind,unknown[],string]>=[["inventory",inventory,"inventoryId"],["collections",collections,"collectionId"],["humidors",humidors,"humidorId"],["readings",readings,"readingId"],["sensors",sensors,"sensorId"],["valuations",valuations,"valuationId"],["smokes",smokes,"smokeId"],["activities",activities,"activityId"]];
    const records=groups.flatMap(([kind,items,id])=>items.map(payload=>({kind,recordId:String((payload as Record<string,unknown>)[id]),payload})));
    const existingByKind=new Map<VaultRecordKind,Set<string>>();
    for(const[kind]of groups){
      const existing=await loadAccountRecords<Record<string,unknown>>(kind);
      if(!existing)throw new Error("Sign in before importing the founder vault");
      const idField=groups.find(([candidate])=>candidate===kind)?.[2];
      existingByKind.set(kind,new Set(existing.map(payload=>String(payload[idField!]||"")).filter(Boolean)));
    }
    const plan=planAdditiveSmartsheetMigration(records,existingByKind);
    const missing=plan.importable,conflicts=plan.preserved;
    return NextResponse.json({data:{
      imported:await importOwnedRecords(missing),
      preserved:conflicts.length,
      policy:plan.policy,
      groups:Object.fromEntries(groups.map(([kind,items])=>[kind,{source:items.length,imported:missing.filter(record=>record.kind===kind).length,preserved:conflicts.filter(record=>record.kind===kind).length}])),
    }});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Import failed"},{status:502});}
}
