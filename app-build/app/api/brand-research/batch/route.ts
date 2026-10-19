import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { brandResearchBacklog } from "@/lib/brand-research";
import { retrieveBrandManufacturingResearch, startBrandManufacturingResearch } from "@/lib/brand-research-report";
import {
  completeManufacturerResearch,connectManufacturerResearch,failManufacturerResearch,
  loadManufacturerEvidenceLedger,MANUFACTURER_BATCH_MAX,reserveManufacturerResearch,
  reviewManufacturerClaim,selectManufacturerResearchBatch,updateManufacturerResearchStatus,
} from "@/lib/manufacturer-evidence";

export const maxDuration=120;
const Start=z.object({batchSize:z.number().int().min(1).max(MANUFACTURER_BATCH_MAX),confirmCreditSpend:z.literal(true)});
const Review=z.object({claimId:z.string().uuid(),decision:z.enum(["approved","rejected"]),note:z.string().trim().max(500).optional()});

async function authorized(request:Request){
  if(authorizeWrite(request))return true;
  if(!supabaseConfigured())return false;
  const{data:{user}}=await(await createClient()).auth.getUser();return Boolean(user);
}

async function refreshActiveRuns(){
  const ledger=await loadManufacturerEvidenceLedger();
  if(ledger.status!=="ready")return ledger;
  for(const run of ledger.runs.filter(item=>["queued","in_progress"].includes(item.status)&&item.response_id).slice(0,MANUFACTURER_BATCH_MAX)){
    try{
      const job=await retrieveBrandManufacturingResearch(run.response_id!);
      if(job.status==="completed"&&job.report)await completeManufacturerResearch(run.run_id,job.report);
      else await updateManufacturerResearchStatus(run.run_id,job.status);
    }catch(error){await failManufacturerResearch(run.run_id,error);}
  }
  return loadManufacturerEvidenceLedger();
}

export async function GET(request:Request){
  if(!await authorized(request))return NextResponse.json({error:"Sign in before opening manufacturer research"},{status:401});
  try{
    const ledger=await refreshActiveRuns();
    const backlog=brandResearchBacklog();
    return NextResponse.json({data:{...ledger,limits:{maximumBatch:MANUFACTURER_BATCH_MAX,cooldownDays:180},next:selectManufacturerResearchBatch(backlog,ledger.runs,MANUFACTURER_BATCH_MAX).map(item=>({brand:item.brand,priority:item.priority,missing:item.missing}))}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Manufacturer research status failed"},{status:502});}
}

export async function POST(request:Request){
  if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization is required before paid manufacturer research"},{status:401});
  try{
    const input=Start.parse(await request.json()),ledger=await loadManufacturerEvidenceLedger();
    if(ledger.status!=="ready")return NextResponse.json({error:ledger.status==="schema-pending"?"Apply the manufacturer evidence migration before research begins":"Manufacturer evidence storage is not configured"},{status:503});
    const selected=selectManufacturerResearchBatch(brandResearchBacklog(),ledger.runs,input.batchSize);
    const started=[] as Array<{brand:string;runId:string;responseId?:string;status:string}>;
    for(const item of selected){
      const run=await reserveManufacturerResearch(item.brand);
      try{
        const job=await startBrandManufacturingResearch(item.brand);
        await connectManufacturerResearch(run.run_id,job.id,job.status);
        if(job.status==="completed"&&job.report)await completeManufacturerResearch(run.run_id,job.report);
        started.push({brand:item.brand,runId:run.run_id,responseId:job.id,status:job.status});
      }catch(error){await failManufacturerResearch(run.run_id,error);throw error;}
    }
    return NextResponse.json({data:{started,requested:input.batchSize,remaining:brandResearchBacklog().length-selected.length}}, {status:started.some(item=>item.status!=="completed")?202:200});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Manufacturer research could not start"},{status:502});}
}

export async function PATCH(request:Request){
  if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});
  try{const input=Review.parse(await request.json());return NextResponse.json({data:await reviewManufacturerClaim(input.claimId,input.decision,input.note)});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Manufacturer evidence review failed"},{status:400});}
}
