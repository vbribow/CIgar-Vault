import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { researchInventoryValuation } from "@/lib/valuation-research";

async function authorized(request:Request){if(authorizeWrite(request))return true;if(!supabaseConfigured())return false;const{data:{user}}=await(await createClient()).auth.getUser();return Boolean(user)}
export async function POST(request:Request){
 if(!await authorized(request))return NextResponse.json({error:"Sign in before researching values"},{status:401});
 try{
  const {inventoryId}=await request.json() as {inventoryId?:string};const item=(await loadInventory()).find(value=>value.inventoryId===inventoryId);if(!item)return NextResponse.json({error:"Inventory lot not found"},{status:404});
  const data=await researchInventoryValuation(item);return NextResponse.json({data:{...data,inventoryId:item.inventoryId,currentQty:item.currentQty,lotMarketValue:data.marketValue===null||item.currentQty===undefined?null:data.marketValue*item.currentQty,lotReplacementValue:data.replacementValue===null||item.currentQty===undefined?null:data.replacementValue*item.currentQty}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Valuation research failed"},{status:502})}
}
