import { NextResponse } from "next/server";
import { HumidorCreateSchema, HumidorUpdateSchema } from "@/lib/humidor-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getHumidors, saveHumidor } from "@/lib/smartsheet";
import { loadHumidors } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode, saveOwnedRecordsAtomically } from "@/lib/user-data";
import { createServerRecordId } from "@/lib/server-record-id";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadHumidors() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const body=await request.json();
    const updating=body?.action==="update";
    const parsed=updating?HumidorUpdateSchema.parse(body):HumidorCreateSchema.parse(body);
    const {action:_action,submissionId,...fields}=parsed as typeof parsed&{action?:string;submissionId?:string};
    const normalized={...fields,humidorId:updating?(fields as typeof fields&{humidorId:string}).humidorId:createServerRecordId("humidor",submissionId)};
    const { memberIds, ...humidor } = normalized;
    if (await accountDataMode() === "supabase") {
      const inventory=await loadInventory();
      const selected=new Set(memberIds);
      const changed=inventory.flatMap(item=>{
        const storageLocationId=selected.has(item.inventoryId)?humidor.humidorId:item.storageLocationId===humidor.humidorId?undefined:item.storageLocationId;
        return storageLocationId===item.storageLocationId?[]:[{...item,storageLocationId}];
      });
      const saved=await saveOwnedRecordsAtomically([
        {kind:"humidors",recordId:humidor.humidorId,payload:humidor},
        ...changed.map(item=>({kind:"inventory" as const,recordId:item.inventoryId,payload:item})),
      ]);
      if(!saved)throw new Error("Sign in before saving private storage records");
      return NextResponse.json({ data: humidor }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await saveHumidor(humidor, memberIds);
    return NextResponse.json({ data: humidor }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
