import type { InventoryItem, Valuation } from "./types";
import { valuationFreshness } from "./valuation-intelligence";

export function valuationNeedsMonitoring(item:InventoryItem, valuations:Valuation[], now=new Date()){
  if((item.currentQty??0)<=0)return false;
  const latest=valuations.filter(value=>value.inventoryId===item.inventoryId).sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];
  const freshness=valuationFreshness(latest?.valuationDate,now);
  return freshness==="Never valued"||freshness==="Stale";
}

export function valuationMonitorPriority(item:InventoryItem){return (item.retailValue??0)*(item.currentQty??0)+(item.priority==="High"?10_000:0)}
