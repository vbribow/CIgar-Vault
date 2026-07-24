import { canonicalCigarIdentity, cigarIdentityKey } from "./cigar-identity";
import type { InventoryItem, Valuation } from "./types";

const DAY_MS=86_400_000;

export type ValuationUsageEvent={created_at:string;properties?:{estimatedCostUsd?:number;cached?:boolean}};

// A valuation is stored per cigar, so box/presentation packaging does not change
// the reusable identity. Vintage remains part of the identity when supplied.
export function valuationIdentityKey(item:InventoryItem){return cigarIdentityKey(item)}

export function valuationIdentityReady(item:InventoryItem){return canonicalCigarIdentity(item).complete}

export function valuationRefreshDays(item:InventoryItem,latest?:Valuation){
  if(latest?.marketValue===undefined&&latest?.replacementValue===undefined&&/insufficient|unsupported|no defensible/i.test(latest?.notes||""))return 180;
  return 30;
}

export function valuationNeedsMonitoring(item:InventoryItem,valuations:Valuation[],now=new Date()){
  if((item.currentQty??0)<=0||!valuationIdentityReady(item))return false;
  const latest=valuations.filter(value=>value.inventoryId===item.inventoryId).sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];
  if(!latest?.valuationDate)return true;
  const insufficient=/insufficient|unsupported|no defensible|not available|not found/i.test(latest.notes||"");
  if(!insufficient&&(item.retailValue===undefined||latest.replacementValue===undefined))return true;
  const parsed=new Date(`${latest.valuationDate}T00:00:00Z`);
  if(Number.isNaN(parsed.getTime()))return true;
  return Math.floor((now.getTime()-parsed.getTime())/DAY_MS)>=valuationRefreshDays(item,latest);
}

export function reusableValuation(item:InventoryItem,candidates:Array<{item:InventoryItem;valuation:Valuation}>,now=new Date()){
  const key=valuationIdentityKey(item);
  return candidates.filter(candidate=>valuationIdentityKey(candidate.item)===key&&candidate.valuation.replacementValue!==undefined&&Boolean(candidate.valuation.sourceUrl)&&/^(High|Medium)$/i.test(candidate.valuation.confidence??"")&&!valuationNeedsMonitoring({...candidate.item,retailValue:candidate.valuation.replacementValue},[candidate.valuation],now)).sort((a,b)=>b.valuation.valuationDate.localeCompare(a.valuation.valuationDate))[0]?.valuation;
}

export function copiedValuation(item:InventoryItem,source:Valuation,now=new Date()):Valuation{
  return{
    ...source,
    valuationId:`VAL-SHARED-${item.inventoryId}-${now.toISOString().replace(/\D/g,"").slice(0,14)}`.slice(0,190),
    inventoryId:item.inventoryId,
    valuationDate:now.toISOString().slice(0,10),
    notes:`Exact-identity value reused during inventory upload. ${source.notes||""}`.trim(),
  };
}

export function applyReusableValuations(items:InventoryItem[],inventory:InventoryItem[],valuations:Valuation[],now=new Date()){
  const inventoryById=new Map(inventory.map(item=>[item.inventoryId,item]));
  const candidates=valuations.flatMap(valuation=>{
    const item=inventoryById.get(valuation.inventoryId);
    return item?[{item,valuation}]:[];
  });
  const shared:Valuation[]=[];
  const valuedItems=items.map(item=>{
    if(item.retailValue!==undefined)return item;
    const reusable=reusableValuation(item,candidates,now);
    if(reusable?.replacementValue===undefined)return item;
    shared.push(copiedValuation(item,reusable,now));
    return{...item,retailValue:reusable.replacementValue};
  });
  return{items:valuedItems,valuations:shared,valuedImmediately:shared.length};
}

export function valuationMonitorPriority(item:InventoryItem){
  return(item.retailValue===undefined?50_000:0)+(item.priority==="High"?10_000:0)+(item.retailValue??0)*(item.currentQty??0);
}

export function valuationBatchSize(value=process.env.VALUATION_BATCH_SIZE){
  const parsed=Number(value||6);
  return Number.isFinite(parsed)?Math.min(6,Math.max(1,Math.floor(parsed))):6;
}

export function valuationCostEstimate(value=process.env.VALUATION_ESTIMATED_COST_USD){const parsed=Number(value||0.02);return Number.isFinite(parsed)&&parsed>0?parsed:0.02}
export function valuationMonthlyBudget(value=process.env.VALUATION_MONTHLY_BUDGET_USD){const parsed=Number(value||10);return Number.isFinite(parsed)&&parsed>0?parsed:10}
export function valuationBudgetStatus(events:ValuationUsageEvent[],now=new Date(),budget=valuationMonthlyBudget(),estimatedCallCost=valuationCostEstimate()){
  const month=now.toISOString().slice(0,7);const estimatedSpend=events.filter(event=>event.created_at?.startsWith(month)&&!event.properties?.cached).reduce((sum,event)=>sum+(Number(event.properties?.estimatedCostUsd)||estimatedCallCost),0);const pauseAt=budget*0.8;return{estimatedSpend,monthlyBudget:budget,pauseAt,remainingBeforePause:Math.max(0,pauseAt-estimatedSpend),paused:estimatedSpend+estimatedCallCost>pauseAt};
}

export async function inValuationBatches<T,R>(items:T[],worker:(item:T)=>Promise<R>,concurrency=2){
  const results:R[]=[];
  for(let index=0;index<items.length;index+=concurrency)results.push(...await Promise.all(items.slice(index,index+concurrency).map(worker)));
  return results;
}
