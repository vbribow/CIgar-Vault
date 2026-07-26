import { NextResponse } from "next/server";
import { loadInventory } from "@/lib/inventory";
import type { Valuation } from "@/lib/types";
import { accountDataMode, loadAccountRecords, saveOwnedRecordsAtomically } from "@/lib/user-data";

type Context={params:Promise<{valuationId:string}>};

export async function PATCH(request:Request,{params}:Context){
  try{
    if(await accountDataMode()!=="supabase")return NextResponse.json({error:"Evidence invalidation requires a signed-in account."},{status:409});
    const{valuationId}=await params;
    const body=await request.json() as {reason?:unknown};
    const reason=typeof body.reason==="string"?body.reason.trim():"";
    if(reason.length<10)return NextResponse.json({error:"Explain why this evidence is invalid."},{status:422});
    const valuations=await loadAccountRecords<Valuation>("valuations")??[];
    const valuation=valuations.find(value=>value.valuationId===valuationId);
    if(!valuation)return NextResponse.json({error:"Valuation evidence was not found."},{status:404});
    if(valuation.invalidatedAt)return NextResponse.json({data:valuation});
    const inventory=(await loadInventory()).find(item=>item.inventoryId===valuation.inventoryId);
    if(!inventory)return NextResponse.json({error:"The linked inventory record was not found."},{status:404});
    const invalidatedAt=new Date().toISOString();
    const invalidated={...valuation,invalidatedAt,invalidationReason:reason};
    const records:Parameters<typeof saveOwnedRecordsAtomically>[0]=[
      {kind:"valuations",recordId:valuation.valuationId,payload:invalidated},
    ];
    if(valuation.replacementValue!==undefined&&inventory.retailValue===valuation.replacementValue){
      const{retailValue:_removed,...correctedInventory}=inventory;
      records.push({kind:"inventory",recordId:inventory.inventoryId,payload:correctedInventory});
    }
    if(!await saveOwnedRecordsAtomically(records))return NextResponse.json({error:"Sign in before correcting valuation evidence."},{status:401});
    return NextResponse.json({data:invalidated});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Evidence invalidation failed."},{status:422});
  }
}
