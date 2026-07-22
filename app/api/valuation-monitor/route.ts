import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeSensorSync } from "@/lib/config";
import { researchInventoryValuation } from "@/lib/valuation-research";
import { inValuationBatches,reusableValuation,valuationBatchSize,valuationBudgetStatus,valuationCostEstimate,valuationMonitorPriority,valuationNeedsMonitoring } from "@/lib/valuation-monitor";
import type { InventoryItem,Valuation } from "@/lib/types";
export const maxDuration=300;

type OwnedGroup={inventory:InventoryItem[];valuations:Valuation[]};
type ValuationWork={userId:string;item:InventoryItem;cached?:Valuation};

export async function GET(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!url||!serviceKey)return NextResponse.json({error:"Scheduled valuation monitoring requires SUPABASE_SERVICE_ROLE_KEY"},{status:503});
  try{
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const monthStart=`${new Date().toISOString().slice(0,7)}-01T00:00:00.000Z`;
    const[{data,error},{data:preferences},{data:usageEvents,error:usageError}]=await Promise.all([
      admin.from("vault_records").select("user_id,kind,record_id,payload").in("kind",["inventory","valuations"]).limit(4000),
      admin.from("account_preferences").select("user_id,valuation_research"),
      admin.from("product_events").select("created_at,properties").eq("event_type","valuation-research").gte("created_at",monthStart).limit(5000),
    ]);
    if(error)throw error;
    if(usageError)throw usageError;
    const users=new Map<string,OwnedGroup>();
    for(const row of data||[]){const group=users.get(row.user_id)||{inventory:[],valuations:[]};if(row.kind==="inventory")group.inventory.push(row.payload as InventoryItem);else group.valuations.push(row.payload as Valuation);users.set(row.user_id,group)}
    const disabled=new Set((preferences||[]).filter(row=>row.valuation_research===false).map(row=>row.user_id));
    const eligible=[...users.entries()].filter(([userId])=>!disabled.has(userId)).flatMap(([userId,group])=>group.inventory.filter(item=>valuationNeedsMonitoring(item,group.valuations)).map(item=>({userId,item}))).sort((a,b)=>valuationMonitorPriority(b.item)-valuationMonitorPriority(a.item));
    const candidates=[...users.values()].flatMap(group=>group.inventory.flatMap(item=>{const valuation=group.valuations.filter(value=>value.inventoryId===item.inventoryId).sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];return valuation?[{item,valuation}]:[]}));
    const requested=Number(new URL(request.url).searchParams.get("limit"));const batchSize=Number.isInteger(requested)&&requested>0?Math.min(requested,valuationBatchSize()):valuationBatchSize();
    const estimatedCallCost=valuationCostEstimate();const budget=valuationBudgetStatus(usageEvents||[],new Date(),undefined,estimatedCallCost);let researchSlots=Math.min(batchSize,Math.max(0,Math.floor(budget.remainingBeforePause/estimatedCallCost)));
    const work:ValuationWork[]=[];
    for(const row of eligible){const cached=reusableValuation(row.item,candidates);if(cached)work.push({...row,cached});else if(researchSlots>0){researchSlots--;work.push(row)}}
    const outcomes=await inValuationBatches(work,async row=>{
      let researchRecorded=false;
      try{
        const research=row.cached?{replacementValue:row.cached.replacementValue??null,marketValue:row.cached.marketValue??null,source:row.cached.source||"Shared valuation evidence",sourceUrl:row.cached.sourceUrl||"",confidence:(row.cached.confidence||"Medium") as "High"|"Medium"|"Low",evidenceDate:row.cached.valuationDate,notes:`Reused current evidence for an exact cigar identity. ${row.cached.notes||""}`,comparables:[]}:await researchInventoryValuation(row.item);
        if(!row.cached){const{error:eventError}=await admin.from("product_events").insert({user_id:row.userId,event_type:"valuation-research",properties:{estimatedCostUsd:estimatedCallCost,model:process.env.OPENAI_VALUATION_MODEL?.trim()||"gpt-5-mini",inventoryId:row.item.inventoryId}});if(eventError)throw eventError;researchRecorded=true}
        const unsupported=research.marketValue===null&&research.replacementValue===null;
        const valuation:Valuation={valuationId:`VAL-AUTO-${row.item.inventoryId}-${research.evidenceDate}`.slice(0,190),inventoryId:row.item.inventoryId,valuationDate:research.evidenceDate,replacementValue:research.replacementValue??undefined,marketValue:research.marketValue??undefined,source:unsupported?"Automated research — insufficient evidence":research.source,sourceUrl:research.sourceUrl||undefined,confidence:research.confidence,notes:`${row.cached?"Shared exact-match evidence.":"Automated scheduled research."} ${unsupported?"Insufficient evidence; defer research for 180 days.":""} ${research.notes}`};
        const{error:saveError}=await admin.from("vault_records").upsert({user_id:row.userId,kind:"valuations",record_id:valuation.valuationId,payload:valuation,updated_at:new Date().toISOString()},{onConflict:"user_id,kind,record_id"});if(saveError)throw saveError;
        if(research.replacementValue!==null){const updated={...row.item,retailValue:research.replacementValue};const{error:inventoryError}=await admin.from("vault_records").update({payload:updated,updated_at:new Date().toISOString()}).eq("user_id",row.userId).eq("kind","inventory").eq("record_id",row.item.inventoryId);if(inventoryError)throw inventoryError}
        return{inventoryId:row.item.inventoryId,status:unsupported?"unsupported":row.cached?"cached":"updated",confidence:research.confidence};
      }catch(error){if(!row.cached&&!researchRecorded)await admin.from("product_events").insert({user_id:row.userId,event_type:"valuation-research",properties:{estimatedCostUsd:estimatedCallCost,model:process.env.OPENAI_VALUATION_MODEL?.trim()||"gpt-5-mini",inventoryId:row.item.inventoryId,failed:true}});return{inventoryId:row.item.inventoryId,status:"failed",error:error instanceof Error?error.message:"Failed"}}
    });
    const completed=outcomes.filter(outcome=>outcome.status!=="failed").length;const researched=outcomes.filter(outcome=>outcome.status==="updated"||outcome.status==="unsupported").length,cached=outcomes.filter(outcome=>outcome.status==="cached").length;
    return NextResponse.json({data:{checked:outcomes.length,batchSize,researched,cached,remainingEligible:Math.max(0,eligible.length-completed),estimatedSpendThisMonth:Math.round((budget.estimatedSpend+researched*estimatedCallCost)*100)/100,monthlyBudget:budget.monthlyBudget,pauseAt:budget.pauseAt,budgetPaused:budget.paused,outcomes}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Valuation monitoring failed"},{status:502})}
}
