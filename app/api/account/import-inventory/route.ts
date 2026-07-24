import { NextResponse } from "next/server";
import { InventoryInputSchema,normalizeInventory } from "@/lib/inventory-model";
import { MAX_IMPORT_BYTES,parseInventoryFile } from "@/lib/inventory-import";
import { deleteOwnedRecord,importOwnedRecords,loadAccountRecords,saveOwnedRecord } from "@/lib/user-data";
import { copiedValuation,reusableValuation } from "@/lib/valuation-monitor";
import { getInventory,getValuations } from "@/lib/smartsheet";
import type { InventoryItem,Valuation } from "@/lib/types";

export const runtime="nodejs";
function reply(error:unknown,status=400){return NextResponse.json({error:error instanceof Error?error.message:"Import failed"},{status})}

export async function POST(request:Request){
 try{
  const existing=await loadAccountRecords<InventoryItem>("inventory");
  if(!existing)return reply(new Error("Sign in before importing inventory"),401);
  const type=request.headers.get("content-type")||"";
  if(type.includes("multipart/form-data")){
   const form=await request.formData(),file=form.get("file");
   if(!(file instanceof File))return reply(new Error("Choose a CSV or Excel file"));
   if(file.size>MAX_IMPORT_BYTES)return reply(new Error("File exceeds the 5 MB upload limit"),413);
   return NextResponse.json({data:await parseInventoryFile(file.name,Buffer.from(await file.arrayBuffer()),existing)});
  }
  const body=await request.json();
  if(body.action==="commit"){
   if(!Array.isArray(body.items)||!body.items.length)return reply(new Error("Select at least one valid row"));
   if(body.items.length>5000)return reply(new Error("Import is limited to 5000 rows"),413);
   const parsedItems:InventoryItem[]=body.items.map((value:unknown)=>normalizeInventory(InventoryInputSchema.parse(value)));
   const existingIds=new Set(existing.map((item:InventoryItem)=>item.inventoryId));
   if(parsedItems.some((item:InventoryItem)=>existingIds.has(item.inventoryId)))return reply(new Error("One or more inventory IDs already exist. Preview the file again."),409);
   const [valuations,sharedInventory,sharedValuations]=await Promise.all([
    loadAccountRecords<Valuation>("valuations").then(value=>value||[]),
    getInventory().catch(()=>[]),
    getValuations().catch(()=>[]),
   ]);
   const allInventory=[...existing,...sharedInventory],allValuations=[...valuations,...sharedValuations];
   const candidates=allInventory.flatMap(item=>{const valuation=allValuations.filter(value=>value.inventoryId===item.inventoryId).sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];return valuation?[{item,valuation}]:[]});
   const shared:Valuation[]=[];
   const items=parsedItems.map(item=>{
    if(item.retailValue!==undefined)return item;
    const reusable=reusableValuation(item,candidates);
    if(!reusable)return item;
    shared.push(copiedValuation(item,reusable));
    return{...item,retailValue:reusable.replacementValue};
   });
   const batchId=`IMPORT-BATCH-${new Date().toISOString()}-${crypto.randomUUID()}`;
   await importOwnedRecords([
    ...items.map((item:InventoryItem)=>({kind:"inventory" as const,recordId:item.inventoryId,payload:item})),
    ...shared.map(value=>({kind:"valuations" as const,recordId:value.valuationId,payload:value})),
   ]);
   await saveOwnedRecord("integrity",batchId,{action:"inventory-spreadsheet-import",batchId,fileName:String(body.fileName||"upload"),inventoryIds:items.map((item:InventoryItem)=>item.inventoryId),valuationIds:shared.map(value=>value.valuationId),count:items.length,createdAt:new Date().toISOString()});
   return NextResponse.json({data:{batchId,imported:items.length,valuedImmediately:shared.length,valuationStatus:shared.length===items.length?"All uploaded cigars received current exact-match values.":"Remaining cigars entered the priority research queue."}});
  }
  if(body.action==="rollback"){
   const audits=await loadAccountRecords<Record<string,unknown>>("integrity");
   const audit=audits?.find(value=>value.batchId===body.batchId&&value.action==="inventory-spreadsheet-import");
   if(!audit||!Array.isArray(audit.inventoryIds))return reply(new Error("Import batch was not found"),404);
   await Promise.all(audit.inventoryIds.map(id=>deleteOwnedRecord("inventory",String(id))));
   if(Array.isArray(audit.valuationIds))await Promise.all(audit.valuationIds.map(id=>deleteOwnedRecord("valuations",String(id))));
   await saveOwnedRecord("integrity",String(body.batchId),{...audit,action:"inventory-spreadsheet-import-rolled-back",rolledBackAt:new Date().toISOString()});
   return NextResponse.json({data:{removed:audit.inventoryIds.length}});
  }
  return reply(new Error("Unknown import action"));
 }catch(error){return reply(error,error instanceof SyntaxError?400:422)}
}
