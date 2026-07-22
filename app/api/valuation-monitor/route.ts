import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeSensorSync } from "@/lib/config";
import { researchInventoryValuation } from "@/lib/valuation-research";
import { valuationMonitorPriority,valuationNeedsMonitoring } from "@/lib/valuation-monitor";
import type { InventoryItem,Valuation } from "@/lib/types";
export const maxDuration=300;

export async function GET(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!url||!serviceKey)return NextResponse.json({error:"Scheduled valuation monitoring requires SUPABASE_SERVICE_ROLE_KEY"},{status:503});
  try{
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const[{data,error},{data:preferences}]=await Promise.all([admin.from("vault_records").select("user_id,kind,record_id,payload").in("kind",["inventory","valuations"]).limit(2000),admin.from("account_preferences").select("user_id,valuation_research")]);if(error)throw error;
    const users=new Map<string,{inventory:InventoryItem[];valuations:Valuation[]}>();
    for(const row of data||[]){const group=users.get(row.user_id)||{inventory:[],valuations:[]};if(row.kind==="inventory")group.inventory.push(row.payload as InventoryItem);else group.valuations.push(row.payload as Valuation);users.set(row.user_id,group)}
    const disabled=new Set((preferences||[]).filter(row=>row.valuation_research===false).map(row=>row.user_id));const eligible=[...users.entries()].filter(([userId])=>!disabled.has(userId)).flatMap(([userId,group])=>group.inventory.filter(item=>valuationNeedsMonitoring(item,group.valuations)).map(item=>({userId,item}))).sort((a,b)=>valuationMonitorPriority(b.item)-valuationMonitorPriority(a.item));
    const due=eligible.slice(0,2),outcomes=[];
    for(const row of due){try{const research=await researchInventoryValuation(row.item);if(research.marketValue===null&&research.replacementValue===null){outcomes.push({inventoryId:row.item.inventoryId,status:"unsupported"});continue}const valuation:Valuation={valuationId:`VAL-AUTO-${row.item.inventoryId}-${research.evidenceDate}`.slice(0,190),inventoryId:row.item.inventoryId,valuationDate:research.evidenceDate,replacementValue:research.replacementValue??undefined,marketValue:research.marketValue??undefined,source:research.source,sourceUrl:research.sourceUrl||undefined,confidence:research.confidence,notes:`Automated scheduled research. ${research.notes}`};const{error:saveError}=await admin.from("vault_records").upsert({user_id:row.userId,kind:"valuations",record_id:valuation.valuationId,payload:valuation,updated_at:new Date().toISOString()},{onConflict:"user_id,kind,record_id"});if(saveError)throw saveError;if(research.replacementValue!==null){const updated={...row.item,retailValue:research.replacementValue};const{error:inventoryError}=await admin.from("vault_records").update({payload:updated,updated_at:new Date().toISOString()}).eq("user_id",row.userId).eq("kind","inventory").eq("record_id",row.item.inventoryId);if(inventoryError)throw inventoryError}outcomes.push({inventoryId:row.item.inventoryId,status:"updated",confidence:research.confidence})}catch(error){outcomes.push({inventoryId:row.item.inventoryId,status:"failed",error:error instanceof Error?error.message:"Failed"})}}
    return NextResponse.json({data:{checked:outcomes.length,remainingEligible:Math.max(0,eligible.length-outcomes.length),outcomes}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Valuation monitoring failed"},{status:502})}
}
