import { isCubanInventory } from "./cuban-verification";
import type { InventoryItem, Valuation } from "./types";

const DAY_MS=86_400_000;
const rarePattern=/vintage|rare|limited|collector|collection|presentation|discontinued|anniversary|opus|forbidden|edici[oó]n|reserva|reserve|regional|exclusive/i;

export type ValuationUsageEvent={created_at:string;properties?:{estimatedCostUsd?:number;cached?:boolean}};

export function valuationIdentityKey(item:InventoryItem){return [item.brand,item.line,item.vitola,item.vintage??"",item.packaging??""].map(value=>String(value).trim().toLowerCase().replace(/\s+/g," ")).join("|")}

export function valuationIdentityReady(item:InventoryItem){return [item.brand,item.line,item.vitola].every(value=>Boolean(value?.trim())&&!/^(unknown|n\/a|tbd|unspecified)$/i.test(value.trim()))}

export function valuationRefreshDays(item:InventoryItem,latest?:Valuation){
  if(latest?.marketValue===undefined&&latest?.replacementValue===undefined&&/insufficient|unsupported|no defensible/i.test(latest?.notes||""))return 180;
  return isCubanInventory(item)||item.priority==="High"||rarePattern.test(`${item.line} ${item.vitola} ${item.packaging||""} ${item.notes||""}`)?60:120;
}

export function valuationNeedsMonitoring(item:InventoryItem,valuations:Valuation[],now=new Date()){
  if((item.currentQty??0)<=0||!valuationIdentityReady(item))return false;
  const latest=valuations.filter(value=>value.inventoryId===item.inventoryId).sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];
  if(!latest?.valuationDate)return true;
  const parsed=new Date(`${latest.valuationDate}T00:00:00Z`);
  if(Number.isNaN(parsed.getTime()))return true;
  return Math.floor((now.getTime()-parsed.getTime())/DAY_MS)>=valuationRefreshDays(item,latest);
}

export function reusableValuation(item:InventoryItem,candidates:Array<{item:InventoryItem;valuation:Valuation}>,now=new Date()){
  const key=valuationIdentityKey(item);
  return candidates.filter(candidate=>candidate.item.inventoryId!==item.inventoryId&&valuationIdentityKey(candidate.item)===key&&Boolean(candidate.valuation.sourceUrl)&&candidate.valuation.confidence!=="Low"&&!valuationNeedsMonitoring(candidate.item,[candidate.valuation],now)).sort((a,b)=>b.valuation.valuationDate.localeCompare(a.valuation.valuationDate))[0]?.valuation;
}

export function valuationMonitorPriority(item:InventoryItem){return (item.retailValue??0)*(item.currentQty??0)+(item.priority==="High"?10_000:0)}

export function valuationBatchSize(value=process.env.VALUATION_BATCH_SIZE){
  const parsed=Number(value||3);
  return Number.isFinite(parsed)?Math.min(6,Math.max(1,Math.floor(parsed))):3;
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
