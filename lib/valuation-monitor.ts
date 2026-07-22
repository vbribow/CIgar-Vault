import type { InventoryItem, Valuation } from "./types";
import { valuationFreshness } from "./valuation-intelligence";

export function valuationNeedsMonitoring(item:InventoryItem, valuations:Valuation[], now=new Date()){
  if((item.currentQty??0)<=0)return false;
  const latest=valuations.filter(value=>value.inventoryId===item.inventoryId).sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];
  const freshness=valuationFreshness(latest?.valuationDate,now);
  return freshness==="Never valued"||freshness==="Stale";
}

export function valuationMonitorPriority(item:InventoryItem){return (item.retailValue??0)*(item.currentQty??0)+(item.priority==="High"?10_000:0)}

export function valuationBatchSize(value=process.env.VALUATION_BATCH_SIZE){
  const parsed=Number(value||12);
  return Number.isFinite(parsed)?Math.min(12,Math.max(1,Math.floor(parsed))):12;
}

export async function inValuationBatches<T,R>(items:T[],worker:(item:T)=>Promise<R>,concurrency=4){
  const results:R[]=[];
  for(let index=0;index<items.length;index+=concurrency)results.push(...await Promise.all(items.slice(index,index+concurrency).map(worker)));
  return results;
}
