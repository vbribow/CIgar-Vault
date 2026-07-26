import { NextResponse } from "next/server";
import { HumidorSchema } from "@/lib/humidor-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getHumidors, saveHumidor } from "@/lib/smartsheet";
import { loadHumidors } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode, saveOwnedRecordsAtomically } from "@/lib/user-data";
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
    const parsed = HumidorSchema.parse(await request.json());
    const { memberIds, ...humidor } = parsed;
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
