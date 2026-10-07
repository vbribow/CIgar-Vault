export type SystemJobId="sensor-sync"|"catalog-discovery"|"industry-content"|"wishlist-monitor"|"valuation-monitor"|"rating-monitor"|"sommelier-research";
export type SystemRun={runId:string;jobId:SystemJobId;status:"Succeeded"|"Failed";startedAt:string;completedAt:string;summary:string;error?:string};
type AutomationOutcome={status?:string;inventoryId?:string;error?:string};
type AutomationData={checked?:number;batchSize?:number;remainingEligible?:number;researched?:number;cached?:number;estimatedSpendThisMonth?:number;monthlyBudget?:number;pauseAt?:number;budgetPaused?:boolean;outcomes?:AutomationOutcome[]};
export type HealthCheck={id:string;name:string;description:string;status:"Ready"|"Attention"|"Unavailable";detail:string;href?:string};
export type SensorFleetSnapshot={total:number;current:number;stale:number;missing:number;latestReadingAt?:string;oldestReadingAt?:string;status:"Ready"|"Attention"};
export function sensorFleetSnapshot(sensors:EnvironmentalSensor[],readings:HumidorReading[],now=Date.now()):SensorFleetSnapshot{
  const automatic=sensors.filter(sensor=>sensor.syncMethod==="Cloud API");
  const latest=new Map<string,HumidorReading>();
  for(const reading of readings){const current=reading.sensorId?latest.get(reading.sensorId):undefined;if(reading.sensorId&&(!current||reading.recordedAt>current.recordedAt))latest.set(reading.sensorId,reading)}
  const timestamps=automatic.flatMap(sensor=>{const reading=latest.get(sensor.sensorId);return reading&&Number.isFinite(Date.parse(reading.recordedAt))?[reading.recordedAt]:[]}).sort();
  const missing=automatic.filter(sensor=>!latest.has(sensor.sensorId)).length;
  const stale=automatic.filter(sensor=>automaticSensorReadingIsStale(sensor,latest.get(sensor.sensorId)?.recordedAt,now)).length;
  return{total:automatic.length,current:Math.max(0,automatic.length-stale),stale,missing,latestReadingAt:timestamps.at(-1),oldestReadingAt:timestamps[0],status:automatic.length>0&&stale===0?"Ready":"Attention"};
}
export function launchJourneyChecks(input:{supabaseReady:boolean;inventoryLoaded:boolean;smokesLoaded:boolean;scoredSmokes:number;sensorFleet:SensorFleetSnapshot;placesReady:boolean}):HealthCheck[]{return[
  {id:"journey-account",name:"Account access and recovery",description:"Sign-in, account records, and password recovery configuration",status:input.supabaseReady?"Ready":"Unavailable",detail:input.supabaseReady?"Account-backed access is configured":"Private account configuration is incomplete",href:"/account"},
  {id:"journey-vault",name:"Vault records",description:"Inventory can load before collectors add, edit, or remove a lot",status:input.inventoryLoaded?"Ready":"Unavailable",detail:input.inventoryLoaded?"Private inventory loaded successfully":"Inventory could not be verified",href:"/inventory"},
  {id:"journey-smoke",name:"Smoke journal",description:"Saved smoke history and rating inputs are reachable",status:input.smokesLoaded?"Ready":"Unavailable",detail:input.smokesLoaded?`${input.scoredSmokes} scored smoke${input.scoredSmokes===1?"":"s"} available to personal rankings`:"Smoke history could not be verified",href:"/smoke-journal"},
  {id:"journey-rankings",name:"Personal and Hojavía rankings",description:"Scored smokes can feed My Top 10 and eligible community rankings",status:input.smokesLoaded&&input.scoredSmokes>0?"Ready":"Attention",detail:input.scoredSmokes>0?"Ranking input is present; community publication remains independently validated":"No scored smoke is available to exercise rankings",href:"/community?tab=ratings#my-top-10"},
  {id:"journey-sensors",name:"Humidor monitoring",description:"Connected SensorPush devices have current readings",status:input.sensorFleet.status,detail:input.sensorFleet.total?`${input.sensorFleet.current} of ${input.sensorFleet.total} cloud sensors current · ${input.sensorFleet.stale} stale`:"No cloud sensor is linked",href:"/sensors"},
  {id:"journey-places",name:"Lounge discovery",description:"Bounded Google Places search and lounge ratings",status:input.placesReady?"Ready":"Attention",detail:input.placesReady?"Live search is enabled with a configured API key":"Live search is intentionally unavailable until Places configuration is complete",href:"/places"},
]}
export const systemJobs:Array<{id:SystemJobId;name:string;path:string;schedule:string;nextDescription:string}>=[
  {id:"sensor-sync",name:"Sensor synchronization",path:"/api/sensor-sync",schedule:"0 * * * *",nextDescription:"Hourly at minute 0"},
  {id:"catalog-discovery",name:"Catalog discovery",path:"/api/catalog-discovery/run",schedule:"0 12 * * 1",nextDescription:"Monday at 12:00 UTC"},
  {id:"industry-content",name:"Industry content",path:"/api/industry-content-monitor",schedule:"30 12 * * 1",nextDescription:"Monday at 12:30 UTC · up to 12 qualified stories · automatic source-labeled publication"},
  {id:"wishlist-monitor",name:"Wishlist monitoring",path:"/api/wishlist-monitor",schedule:"30 13 * * *",nextDescription:"Daily at 13:30 UTC"},
  {id:"valuation-monitor",name:"Valuation monitoring",path:"/api/valuation-monitor",schedule:"15 13 1 * *",nextDescription:"Monthly on the 1st · new uploads first · up to 6 due lots"},
  {id:"rating-monitor",name:"Professional rating coverage",path:"/api/rating-monitor",schedule:"30 14 * * 0",nextDescription:"Sunday at 14:30 UTC"},
  {id:"sommelier-research",name:"Master Somm research",path:"/api/sommelier-knowledge/research",schedule:"0 15 * * 2",nextDescription:"Tuesday at 15:00 UTC · founder review required"},
];
export function validSystemRuns(records:unknown[]):SystemRun[]{
  const jobIds=new Set(systemJobs.map(job=>job.id));
  return records.filter((record):record is SystemRun=>{
    if(!record||typeof record!=="object")return false;
    const value=record as Partial<SystemRun>;
    return typeof value.runId==="string"&&value.runId.length>0
      &&typeof value.jobId==="string"&&jobIds.has(value.jobId as SystemJobId)
      &&(value.status==="Succeeded"||value.status==="Failed")
      &&typeof value.startedAt==="string"&&value.startedAt.length>0
      &&typeof value.completedAt==="string"&&value.completedAt.length>0
      &&typeof value.summary==="string";
  });
}
export function configurationChecks(environment:Record<string,string|undefined>):HealthCheck[]{const has=(...names:string[])=>names.every(name=>Boolean(environment[name]?.trim()));return[
  {id:"data-authority",name:"Data authority contract",description:"Private vault ownership and explicit migration direction",status:dataAuthorityIsUnambiguous()?"Ready":"Attention",detail:dataAuthorityIsUnambiguous()?"Signed-in Supabase vaults are authoritative; Smartsheet is an explicit founder migration source only":"One or more record kinds has an ambiguous authority rule",href:"/data-model"},
  {id:"supabase",name:"Private account database",description:"Authentication and private vault records",status:has("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY")?"Ready":"Attention",detail:has("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY")?"Public and scheduled-service credentials configured":"One or more Supabase credentials are missing"},
  {id:"smartsheet",name:"Smartsheet migration source",description:"Founder operations, controlled migration, and supporting sheets",status:has("SMARTSHEET_ACCESS_TOKEN","SMARTSHEET_INVENTORY_SHEET_ID")?"Ready":"Attention",detail:has("SMARTSHEET_ACCESS_TOKEN","SMARTSHEET_INVENTORY_SHEET_ID")?"One-way founder migration source configured":"Access token or inventory sheet ID is missing"},
  {id:"openai",name:"Research intelligence",description:"Catalog, pricing, ratings, and photo identification",status:has("OPENAI_API_KEY")?"Ready":"Attention",detail:has("OPENAI_API_KEY")?"OpenAI research is configured":"OPENAI_API_KEY is missing"},
  {id:"stripe",name:"Founder billing",description:"Secure annual membership checkout and account management",status:has("STRIPE_SECRET_KEY","STRIPE_FOUNDER_PRICE_ID")?"Ready":"Attention",detail:has("STRIPE_SECRET_KEY","STRIPE_FOUNDER_PRICE_ID")?"Stripe secret and Founder price configured":"Stripe secret or Founder price ID is missing",href:"/pricing"},
  {id:"scheduler",name:"Scheduled operations",description:"Protected Vercel cron execution",status:has("CRON_SECRET")?"Ready":"Attention",detail:has("CRON_SECRET")?"Scheduler secret configured":"CRON_SECRET is missing"},
  {id:"sensorpush",name:"SensorPush cloud",description:"Optional automatic climate synchronization",status:has("SENSORPUSH_EMAIL","SENSORPUSH_PASSWORD")?"Ready":"Attention",detail:has("SENSORPUSH_EMAIL","SENSORPUSH_PASSWORD")?"Cloud credentials configured":"Optional SensorPush credentials are incomplete",href:"/sensors"},
  {id:"smartsheet-sensors",name:"Climate data sheet",description:"Sensor and reading persistence",status:has("SMARTSHEET_SENSORS_SHEET_ID")?"Ready":"Attention",detail:has("SMARTSHEET_SENSORS_SHEET_ID")?"Sensor sheet configured":"SMARTSHEET_SENSORS_SHEET_ID is missing",href:"/sensors"},
]}
export function latestRuns(runs:SystemRun[]){return new Map(systemJobs.map(job=>[job.id,[...runs].filter(run=>run.jobId===job.id).sort((a,b)=>b.completedAt.localeCompare(a.completedAt))[0]]))}
export function healthScore(checks:HealthCheck[],jobs=systemJobs,runs:SystemRun[]=[]){const ready=checks.filter(check=>check.status==="Ready").length;const failedLatest=[...latestRuns(runs).values()].filter(run=>run?.status==="Failed").length;return Math.max(0,Math.round(ready/checks.length*100)-Math.round(failedLatest/Math.max(1,jobs.length)*25))}
export function automationRunSummary(data:unknown){
  if(!data||typeof data!=="object")return "Automation completed.";
  const value=data as AutomationData;
  if(!Array.isArray(value.outcomes))return JSON.stringify(value).slice(0,500)||"Automation completed.";
  const counts=value.outcomes.reduce<Record<string,number>>((result,outcome)=>{const status=outcome.status||"unknown";result[status]=(result[status]||0)+1;return result},{});
  const parts=[`Checked ${value.checked??value.outcomes.length}`];
  for(const status of ["updated","cached","unsupported","failed","skipped"])if(counts[status])parts.push(`${counts[status]} ${status}`);
  if(typeof value.remainingEligible==="number")parts.push(`${value.remainingEligible} remaining`);
  if(typeof value.estimatedSpendThisMonth==="number"&&typeof value.monthlyBudget==="number")parts.push(`Est. $${value.estimatedSpendThisMonth.toFixed(2)} / $${value.monthlyBudget.toFixed(2)} monthly`);
  if(value.budgetPaused)parts.push("paused at budget guardrail");
  const failures=value.outcomes.filter(outcome=>outcome.status==="failed"&&outcome.error).slice(0,3).map(outcome=>`${outcome.inventoryId||"lot"}: ${outcome.error}`);
  return `${parts.join(" · ")}${failures.length?`. Errors: ${failures.join(" | ")}`:""}`.slice(0,700);
}
export function automationRunSucceeded(data:unknown){
  if(!data||typeof data!=="object")return true;
  const outcomes=(data as AutomationData).outcomes;
  return !Array.isArray(outcomes)||outcomes.every(outcome=>outcome.status!=="failed");
}
export function readableError(error:unknown){
  if(error instanceof Error)return error.message;
  if(error&&typeof error==="object"){
    const value=error as {message?:unknown;details?:unknown;hint?:unknown;code?:unknown};
    return [value.message,value.details,value.hint,value.code].filter(part=>typeof part==="string"&&part).join(" · ")||"Run failed";
  }
  return typeof error==="string"?error:"Run failed";
}

export type ValuationOperationsSnapshot = {
  totalLots:number;
  retailCovered:number;
  retailCoveragePercent:number;
  due:number;
  neverValued:number;
  latestEvidenceAt?:string;
  latestAutomatedAt?:string;
  status:"Ready"|"Attention";
};

export function valuationOperationsSnapshot(inventory:InventoryItem[],valuations:Valuation[],collections:CigarCollection[]=[]):ValuationOperationsSnapshot{
  inventory=cigarInventoryRecords(inventory,collections).filter(item=>(item.currentQty??0)>0);
  const latestEvidenceAt=valuations.map(value=>value.valuationDate).filter(Boolean).sort().at(-1);
  const latestAutomatedAt=valuations.filter(value=>/automated scheduled|shared exact-match/i.test(value.notes||"")).map(value=>value.valuationDate).filter(Boolean).sort().at(-1);
  const valuedIds=new Set(valuations.filter(value=>value.replacementValue!==undefined||value.marketValue!==undefined||value.askingPrice!==undefined||value.lastSaleValue!==undefined||value.marketEvidenceType==="Insufficient evidence").map(value=>value.inventoryId));
  const retailCovered=inventory.filter(item=>item.retailValue!==undefined||valuations.some(value=>value.inventoryId===item.inventoryId&&value.replacementValue!==undefined)).length;
  const due=inventory.filter(item=>valuationNeedsMonitoring(item,valuations)).length;
  const neverValued=inventory.filter(item=>!valuedIds.has(item.inventoryId)).length;
  return{totalLots:inventory.length,retailCovered,retailCoveragePercent:inventory.length?Math.round(retailCovered/inventory.length*100):100,due,neverValued,latestEvidenceAt,latestAutomatedAt,status:due===0?"Ready":"Attention"};
}
import { dataAuthorityIsUnambiguous } from "./data-authority";
import { cigarInventoryRecords } from "./collection-presentation";
import { valuationNeedsMonitoring } from "./valuation-monitor";
import { automaticSensorReadingIsStale } from "./sensor-model";
import type { CigarCollection, EnvironmentalSensor, HumidorReading, InventoryItem, Valuation } from "./types";
