import { NextResponse } from "next/server";
import { CollectionCreateInputSchema } from "@/lib/collection-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getCollections, saveCollection } from "@/lib/smartsheet";
import { loadCollections } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode, deleteOwnedRecord, saveOwnedRecordsAtomically } from "@/lib/user-data";
import { collectionRequirementMatches, collectionTemplateFor } from "@/lib/collection-dashboard";
import { isPresentationInventoryMatch } from "@/lib/collection-presentation";
import { auditCollectionTemplateProtocol } from "@/lib/collection-templates";
import { createServerRecordId } from "@/lib/server-record-id";
import { isPrivateInventoryPreviewRequest, savePreviewInventoryOverride } from "@/lib/preview-inventory";
import { loadPreviewCollections, savePreviewCollection } from "@/lib/preview-collections";
import { collectionRevision } from "@/lib/collection-revision";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: await loadPreviewCollections() });
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
    const existingCollection=fields.collectionId?existingCollections.find(value=>value.collectionId===fields.collectionId):undefined;
    const suppliedExisting=Boolean(existingCollection);
    const suppliedTemplate=Boolean(fields.collectionId&&collectionTemplateFor(fields as Parameters<typeof collectionTemplateFor>[0]));
    if(fields.collectionId&&!suppliedExisting&&!suppliedTemplate)return NextResponse.json({error:"Hojavía creates collection references automatically. Choose a researched edition or edit an existing collection."},{status:409});
    const collection={...fields,collectionId:fields.collectionId||createServerRecordId("collection",submissionId)};
    const inventory=await loadInventory();
    if(existingCollection){
      const expectedRevision=request.headers.get("if-match");
      if(!expectedRevision)return NextResponse.json({error:"Refresh this collection before saving so Hojavía can protect changes made on another device."},{status:428});
      if(expectedRevision!==collectionRevision(existingCollection,inventory))return NextResponse.json({error:"This collection or its membership changed on another device. Refresh, review the newer information, and try again."},{status:409});
    }
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
    if (dataMode() === "mock") {
      if (!isPrivateInventoryPreviewRequest(request))
        return NextResponse.json(
          { error: "Local preview edits are allowed only from this private development host." },
          { status: 403 },
        );
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
      await savePreviewCollection(collection);
      for(const item of changed)await savePreviewInventoryOverride(item);
      return NextResponse.json({ data: collection, memberIds, storage: "local-preview" }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await saveCollection(collection, memberIds);
    return NextResponse.json({ data: collection, memberIds }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}

export async function DELETE(request:Request){
  try{
    const {collectionId}=await request.json() as {collectionId?:string};
    if(!collectionId)return NextResponse.json({error:"Collection reference is required"},{status:422});
    const [collections,inventory,mode]=await Promise.all([loadCollections(),loadInventory(),accountDataMode()]);
    const collection=collections.find(value=>value.collectionId===collectionId);
    if(!collection)return NextResponse.json({error:"Collection not found"},{status:404});
    if(inventory.some(item=>item.collectionId===collectionId))return NextResponse.json({error:"Remove or reassign the collection’s inventory before deleting its record."},{status:409});
    if(mode!=="supabase")return NextResponse.json({error:"Empty collection removal is available only for signed-in private Vault records."},{status:405});
    if(!await deleteOwnedRecord("collections",collectionId))return NextResponse.json({error:"Sign in before removing a private collection record"},{status:401});
    return new NextResponse(null,{status:204});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Collection removal failed"},{status:422});
  }
}
