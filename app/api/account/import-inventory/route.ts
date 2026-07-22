import { NextResponse } from "next/server";
import { InventoryInputSchema,normalizeInventory } from "@/lib/inventory-model";
import { MAX_IMPORT_BYTES,parseInventoryFile } from "@/lib/inventory-import";
import { deleteOwnedRecord,importOwnedRecords,loadAccountRecords,saveOwnedRecord } from "@/lib/user-data";
import type { InventoryItem } from "@/lib/types";

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
   const items:InventoryItem[]=body.items.map((value:unknown)=>normalizeInventory(InventoryInputSchema.parse(value)));
   const existingIds=new Set(existing.map((item:InventoryItem)=>item.inventoryId));
   if(items.some((item:InventoryItem)=>existingIds.has(item.inventoryId)))return reply(new Error("One or more inventory IDs already exist. Preview the file again."),409);
   const batchId=`IMPORT-BATCH-${new Date().toISOString()}-${crypto.randomUUID()}`;
   await importOwnedRecords(items.map((item:InventoryItem)=>({kind:"inventory" as const,recordId:item.inventoryId,payload:item})));
   await saveOwnedRecord("integrity",batchId,{action:"inventory-spreadsheet-import",batchId,fileName:String(body.fileName||"upload"),inventoryIds:items.map((item:InventoryItem)=>item.inventoryId),count:items.length,createdAt:new Date().toISOString()});
   return NextResponse.json({data:{batchId,imported:items.length}});
  }
  if(body.action==="rollback"){
   const audits=await loadAccountRecords<Record<string,unknown>>("integrity");
   const audit=audits?.find(value=>value.batchId===body.batchId&&value.action==="inventory-spreadsheet-import");
   if(!audit||!Array.isArray(audit.inventoryIds))return reply(new Error("Import batch was not found"),404);
   await Promise.all(audit.inventoryIds.map(id=>deleteOwnedRecord("inventory",String(id))));
   await saveOwnedRecord("integrity",String(body.batchId),{...audit,action:"inventory-spreadsheet-import-rolled-back",rolledBackAt:new Date().toISOString()});
   return NextResponse.json({data:{removed:audit.inventoryIds.length}});
  }
  return reply(new Error("Unknown import action"));
 }catch(error){return reply(error,error instanceof SyntaxError?400:422)}
}
