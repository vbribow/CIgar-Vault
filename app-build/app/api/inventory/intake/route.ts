import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite, dataMode } from "@/lib/config";
import { findInventoryDuplicates } from "@/lib/photo-intake";
import { InventoryInputSchema, normalizeInventory } from "@/lib/inventory-model";
import { addInventoryRows, getInventory } from "@/lib/smartsheet";
import { importOwnedRecords, loadAccountRecords } from "@/lib/user-data";
import type { InventoryItem } from "@/lib/types";

const Body=z.object({
  drafts:z.array(InventoryInputSchema).min(1).max(25),
  acknowledgedDuplicateIds:z.array(z.string()).max(25).default([]),
  syncMaster:z.boolean().default(false),
});

export async function POST(request:Request){
  try{
    const input=Body.parse(await request.json());
    const drafts=input.drafts.map(normalizeInventory);
    if(new Set(drafts.map(item=>item.inventoryId)).size!==drafts.length)return NextResponse.json({error:"The selected drafts contain duplicate inventory IDs"},{status:409});
    const account=await loadAccountRecords<InventoryItem>("inventory");
    const signedIn=account!==undefined;
    if(!signedIn&&!authorizeWrite(request))return NextResponse.json({error:"Sign in before approving inventory drafts"},{status:401});
    const current=account??await getInventory();
    const ids=new Set(current.map(item=>item.inventoryId));
    const duplicateIds=drafts.filter(item=>ids.has(item.inventoryId)).map(item=>item.inventoryId);
    if(duplicateIds.length)return NextResponse.json({error:`Inventory IDs already exist: ${duplicateIds.join(", ")}`},{status:409});
    const acknowledged=new Set(input.acknowledgedDuplicateIds);
    const unreviewed=drafts.flatMap(item=>findInventoryDuplicates(item,current).length&&!acknowledged.has(item.inventoryId)?[item.inventoryId]:[]);
    if(unreviewed.length)return NextResponse.json({error:`Review possible duplicates before approval: ${unreviewed.join(", ")}`,duplicateIds:unreviewed},{status:409});
    if(input.syncMaster&&!authorizeWrite(request))return NextResponse.json({error:"Founder authorization is required to synchronize the Smartsheet master"},{status:401});
    let masterSaved=0;
    if(input.syncMaster){
      const master=await getInventory();
      const masterIds=new Set(master.map(item=>item.inventoryId));
      const conflicts=drafts.filter(item=>masterIds.has(item.inventoryId)).map(item=>item.inventoryId);
      if(conflicts.length)return NextResponse.json({error:`Already present in the Smartsheet master: ${conflicts.join(", ")}`},{status:409});
      masterSaved=await addInventoryRows(drafts);
    }
    const accountSaved=signedIn?await importOwnedRecords(drafts.map(payload=>({kind:"inventory" as const,recordId:payload.inventoryId,payload}))):0;
    if(!signedIn&&!input.syncMaster&&dataMode()!=="mock")masterSaved=await addInventoryRows(drafts);
    return NextResponse.json({data:{approved:drafts.length,accountSaved,masterSaved,synchronized:input.syncMaster&&accountSaved===drafts.length&&masterSaved===drafts.length,inventory:drafts}},{status:201});
  }catch(error){
    if(error instanceof z.ZodError)return NextResponse.json({error:"One or more drafts contain invalid inventory data",issues:error.issues},{status:422});
    return NextResponse.json({error:error instanceof Error?error.message:"Inventory intake failed"},{status:502});
  }
}
