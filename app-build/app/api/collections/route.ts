import { NextResponse } from "next/server";
import { CollectionCreateInputSchema } from "@/lib/collection-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getCollections, saveCollection } from "@/lib/smartsheet";
import { loadCollections } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode, saveOwnedRecordsAtomically } from "@/lib/user-data";
import { collectionRequirementMatches, collectionTemplateFor } from "@/lib/collection-dashboard";
import { isPresentationInventoryMatch } from "@/lib/collection-presentation";
import { auditCollectionTemplateProtocol } from "@/lib/collection-templates";
import { createServerRecordId } from "@/lib/server-record-id";
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
    const parsed = CollectionCreateInputSchema.parse(await request.json());
    const { memberIds, submissionId, ...fields } = parsed;
    const existingCollections=await loadCollections();
    const suppliedExisting=Boolean(fields.collectionId&&existingCollections.some(value=>value.collectionId===fields.collectionId));
    const suppliedTemplate=Boolean(fields.collectionId&&collectionTemplateFor(fields as Parameters<typeof collectionTemplateFor>[0]));
    if(fields.collectionId&&!suppliedExisting&&!suppliedTemplate)return NextResponse.json({error:"Cedriva creates collection references automatically. Choose a researched edition or edit an existing collection."},{status:409});
    const collection={...fields,collectionId:fields.collectionId||createServerRecordId("collection",submissionId)};
    const inventory=await loadInventory();
    const presentationAsset=collection.presentationInventoryId
      ? inventory.find(item=>item.inventoryId===collection.presentationInventoryId)
      : undefined;
    if(collection.presentationInventoryId&&!presentationAsset)return NextResponse.json({error:"Presentation inventory record not found"},{status:409});
    if(presentationAsset&&!isPresentationInventoryMatch(presentationAsset,collection))return NextResponse.json({error:"The selected presentation record does not exactly match this researched collection"},{status:409});
    if(collection.presentationInventoryId&&memberIds.includes(collection.presentationInventoryId))return NextResponse.json({error:"A presentation humidor or case cannot also be saved as a cigar component"},{status:409});
    const template=collectionTemplateFor(collection);
    if(memberIds.length&&!template)return NextResponse.json({error:"Research and document this collection’s exact sourced components before assigning collector inventory."},{status:409});
    if(template){
      const protocol=auditCollectionTemplateProtocol(template);
      const selected=inventory.filter(item=>memberIds.includes(item.inventoryId));
      const verifiedIds=new Set(collectionRequirementMatches(collection,selected).flatMap(match=>match.inventoryId?[match.inventoryId]:[]));
      const unverified=memberIds.filter(inventoryId=>!verifiedIds.has(inventoryId));
      if(unverified.length)return NextResponse.json({error:`${unverified.length} selected lot${unverified.length===1?" does":"s do"} not exactly match a sourced component and cannot be assigned.`},{status:409});
      if(memberIds.length&&!protocol.sourcedRequirements.length)return NextResponse.json({error:"This collection remains in sourced component research and cannot receive inventory assignments yet."},{status:409});
    }
    if (await accountDataMode() === "supabase") {
      const selected=new Set(memberIds);
      const changed=inventory.flatMap(item=>{
        const collectionId=item.inventoryId===collection.presentationInventoryId
          ? undefined
          : selected.has(item.inventoryId)
            ? collection.collectionId
            : item.collectionId===collection.collectionId
              ? undefined
              : item.collectionId;
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
