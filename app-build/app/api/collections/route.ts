import { NextResponse } from "next/server";
import { CollectionInputSchema } from "@/lib/collection-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getCollections, saveCollection } from "@/lib/smartsheet";
import { loadCollections } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode, saveOwnedRecordsAtomically } from "@/lib/user-data";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadCollections() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const parsed = CollectionInputSchema.parse(await request.json());
    const { memberIds, ...collection } = parsed;
    if (await accountDataMode() === "supabase") {
      const inventory=await loadInventory();
      const selected=new Set(memberIds);
      const changed=inventory.flatMap(item=>{
        const collectionId=selected.has(item.inventoryId)?collection.collectionId:item.collectionId===collection.collectionId?undefined:item.collectionId;
        return collectionId===item.collectionId?[]:[{...item,collectionId}];
      });
      const saved=await saveOwnedRecordsAtomically([
        {kind:"collections",recordId:collection.collectionId,payload:collection},
        ...changed.map(item=>({kind:"inventory" as const,recordId:item.inventoryId,payload:item})),
      ]);
      if(!saved)throw new Error("Sign in before saving private collection records");
      return NextResponse.json({ data: collection, memberIds }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    await saveCollection(collection, memberIds);
    return NextResponse.json({ data: collection, memberIds }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
