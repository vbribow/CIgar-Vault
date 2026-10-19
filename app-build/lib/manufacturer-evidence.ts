import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { canonicalBrand } from "./brand-directory";
import type { BrandResearchItem } from "./brand-research";
import type { BrandResearchReport } from "./brand-research-report";
import type { BrandManufacturingCoverage } from "./manufacturing-truth";

export const MANUFACTURER_BATCH_MAX=3;
export const MANUFACTURER_RESEARCH_COOLDOWN_DAYS=180;

export type ManufacturerRun={
  run_id:string;brand_key:string;brand:string;response_id?:string;status:string;
  started_at:string;completed_at?:string;next_eligible_at?:string;error_message?:string;
};

export type ManufacturerClaim={
  claim_id:string;brand_key:string;brand:string;claim_type:"owner"|"authorship"|"manufacturing";
  scope:string;claim_value:string;country?:string;production_period?:string;relationship?:string;
  source_title:string;source_url:string;source_type:"Official"|"Verified Historical"|"Expert";
  evidence_date?:string;confidence:"High"|"Medium"|"Low";
  evidence_status:"Verified"|"Partially verified"|"Unresolved";
  decision:"pending"|"auto_approved"|"approved"|"rejected"|"superseded";
  review_note?:string;created_at:string;
};

export function manufacturerBrandKey(value:string){
  return canonicalBrand(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export function manufacturerClaimHash(value:{brand:string;claimType:string;scope:string;claimValue:string;sourceUrl:string}){
  const normalized=[manufacturerBrandKey(value.brand),value.claimType,value.scope.trim().toLowerCase(),value.claimValue.trim().toLowerCase(),value.sourceUrl.trim().replace(/\/$/,"")].join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export function manufacturerClaimDecision(claim:{status:string;confidence:string;sourceType:string;sourceUrl:string}){
  return claim.status==="Verified"&&claim.confidence==="High"&&claim.sourceType==="Official"&&/^https:\/\//i.test(claim.sourceUrl)?"auto_approved" as const:"pending" as const;
}

export function selectManufacturerResearchBatch(backlog:BrandResearchItem[],runs:ManufacturerRun[],batchSize:number,now=new Date()){
  const size=Math.max(1,Math.min(MANUFACTURER_BATCH_MAX,Math.trunc(batchSize)||1));
  const latest=new Map<string,ManufacturerRun>();
  for(const run of [...runs].sort((a,b)=>b.started_at.localeCompare(a.started_at)))if(!latest.has(run.brand_key))latest.set(run.brand_key,run);
  return backlog.filter(item=>{
    const run=latest.get(manufacturerBrandKey(item.brand));
    if(!run)return true;
    if(["starting","queued","in_progress"].includes(run.status))return false;
    return !run.next_eligible_at||Date.parse(run.next_eligible_at)<=now.getTime();
  }).slice(0,size);
}

function admin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):undefined;
}

function schemaPending(error:{message?:string}|null|undefined){return Boolean(error&&/relation .* does not exist|schema cache/i.test(error.message||""));}

export async function loadManufacturerEvidenceLedger(){
  const client=admin();
  if(!client)return{status:"not-configured" as const,runs:[] as ManufacturerRun[],claims:[] as ManufacturerClaim[]};
  const[runs,claims]=await Promise.all([
    client.from("manufacturer_research_runs").select("run_id,brand_key,brand,response_id,status,started_at,completed_at,next_eligible_at,error_message").order("started_at",{ascending:false}).limit(500),
    client.from("manufacturer_evidence_claims").select("claim_id,brand_key,brand,claim_type,scope,claim_value,country,production_period,relationship,source_title,source_url,source_type,evidence_date,confidence,evidence_status,decision,review_note,created_at").order("created_at",{ascending:false}).limit(3000),
  ]);
  if(schemaPending(runs.error)||schemaPending(claims.error))return{status:"schema-pending" as const,runs:[] as ManufacturerRun[],claims:[] as ManufacturerClaim[]};
  if(runs.error)throw runs.error;if(claims.error)throw claims.error;
  return{status:"ready" as const,runs:(runs.data||[]) as ManufacturerRun[],claims:(claims.data||[]) as ManufacturerClaim[]};
}

export async function reserveManufacturerResearch(brand:string){
  const client=admin();if(!client)throw new Error("Manufacturer evidence storage is not configured");
  const brandKey=manufacturerBrandKey(brand);
  const prior=await client.from("manufacturer_research_runs").select("status,next_eligible_at").eq("brand_key",brandKey).order("started_at",{ascending:false}).limit(1).maybeSingle();
  if(prior.error){if(schemaPending(prior.error))throw new Error("Manufacturer evidence migration is not applied");throw prior.error;}
  if(prior.data&&["starting","queued","in_progress"].includes(prior.data.status))throw new Error(`${brand} research is already running`);
  if(prior.data?.next_eligible_at&&Date.parse(prior.data.next_eligible_at)>Date.now())throw new Error(`${brand} already has current research and is inside the 180-day credit cooldown`);
  const result=await client.from("manufacturer_research_runs").insert({brand,brand_key:brandKey,status:"starting"}).select("run_id,brand_key,brand,status,started_at").single();
  if(result.error){if(schemaPending(result.error))throw new Error("Manufacturer evidence migration is not applied");throw result.error;}
  return result.data as ManufacturerRun;
}

export async function connectManufacturerResearch(runId:string,responseId:string,status:string){
  const client=admin();if(!client)throw new Error("Manufacturer evidence storage is not configured");
  const result=await client.from("manufacturer_research_runs").update({response_id:responseId,status,updated_at:new Date().toISOString()}).eq("run_id",runId);
  if(result.error)throw result.error;
}

export async function updateManufacturerResearchStatus(runId:string,status:string){
  const client=admin();if(!client)throw new Error("Manufacturer evidence storage is not configured");
  const result=await client.from("manufacturer_research_runs").update({status,updated_at:new Date().toISOString()}).eq("run_id",runId);
  if(result.error)throw result.error;
}

export async function failManufacturerResearch(runId:string,error:unknown){
  const client=admin();if(!client)return;
  const message=error instanceof Error?error.message:String(error);
  await client.from("manufacturer_research_runs").update({status:"failed",error_message:message.slice(0,500),updated_at:new Date().toISOString(),next_eligible_at:new Date(Date.now()+24*60*60*1000).toISOString()}).eq("run_id",runId);
}

export function manufacturerClaimsFromReport(report:BrandResearchReport,runId:string){
  const common=(claim:{status:string;confidence:string;sourceTitle:string;sourceUrl:string;sourceType:string;evidenceDate:string;notes:string})=>({
    run_id:runId,brand_key:manufacturerBrandKey(report.brand),brand:report.brand,source_title:claim.sourceTitle,source_url:claim.sourceUrl,
    source_type:claim.sourceType,evidence_date:claim.evidenceDate||null,confidence:claim.confidence,evidence_status:claim.status,
    decision:manufacturerClaimDecision(claim),review_note:claim.notes||null,
  });
  const raw=[
    {claim_type:"owner",scope:"Brand",claim_value:report.brandOwner.value,country:null,production_period:null,relationship:null,...common(report.brandOwner)},
    ...report.creativeAuthorship.map(claim=>({claim_type:"authorship",scope:"Brand or named role",claim_value:claim.value,country:null,production_period:null,relationship:null,...common(claim)})),
    ...report.manufacturingRelationships.map(claim=>({claim_type:"manufacturing",scope:claim.lineOrRelease,claim_value:claim.factory,country:claim.country||null,production_period:claim.productionPeriod||null,relationship:claim.relationship||null,...common(claim)})),
  ].filter(claim=>claim.claim_value&&claim.claim_value!=="Unresolved"&&claim.source_url);
  return raw.map(claim=>({...claim,claim_hash:manufacturerClaimHash({brand:report.brand,claimType:claim.claim_type,scope:claim.scope,claimValue:claim.claim_value,sourceUrl:claim.source_url})}));
}

export async function completeManufacturerResearch(runId:string,report:BrandResearchReport){
  const client=admin();if(!client)throw new Error("Manufacturer evidence storage is not configured");
  const claims=manufacturerClaimsFromReport(report,runId);
  if(claims.length){const saved=await client.from("manufacturer_evidence_claims").upsert(claims,{onConflict:"claim_hash",ignoreDuplicates:true});if(saved.error)throw saved.error;}
  const completedAt=new Date().toISOString(),nextEligibleAt=new Date(Date.now()+MANUFACTURER_RESEARCH_COOLDOWN_DAYS*24*60*60*1000).toISOString();
  const result=await client.from("manufacturer_research_runs").update({status:"completed",report_payload:report,error_message:null,completed_at:completedAt,next_eligible_at:nextEligibleAt,updated_at:completedAt}).eq("run_id",runId);
  if(result.error)throw result.error;
  return{claims:claims.length,autoApproved:claims.filter(item=>item.decision==="auto_approved").length,pending:claims.filter(item=>item.decision==="pending").length};
}

export async function reviewManufacturerClaim(claimId:string,decision:"approved"|"rejected",note?:string){
  const client=admin();if(!client)throw new Error("Manufacturer evidence storage is not configured");
  const result=await client.from("manufacturer_evidence_claims").update({decision,review_note:note||null,reviewed_by:"founder",reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("claim_id",claimId).select("claim_id,decision").single();
  if(result.error)throw result.error;return result.data;
}

export function mergeManufacturerEvidence(records:BrandManufacturingCoverage[],claims:ManufacturerClaim[]){
  const approved=claims.filter(claim=>claim.claim_type==="manufacturing"&&["auto_approved","approved"].includes(claim.decision)&&claim.evidence_status==="Verified");
  const grouped=new Map<string,ManufacturerClaim[]>();for(const claim of approved){const list=grouped.get(claim.brand_key)||[];list.push(claim);grouped.set(claim.brand_key,list);}
  return records.map(record=>{
    const evidence=grouped.get(manufacturerBrandKey(record.brand));if(!evidence?.length)return record;
    const unique=[...new Map(evidence.map(claim=>[`${claim.claim_value}|${claim.scope}|${claim.production_period||""}`,claim])).values()];
    const first=unique[0]!;
    return{...record,status:"Factory verified" as const,manufacturing:unique.slice(0,6).map(claim=>`${claim.claim_value} — ${claim.scope}${claim.production_period?` (${claim.production_period})`:""}`).join(" · "),evidence:`${unique.length} source-linked release relationship${unique.length===1?"":"s"}`,href:first.source_url,sourceUrl:first.source_url};
  });
}
