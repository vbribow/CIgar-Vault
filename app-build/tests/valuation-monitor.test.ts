import assert from "node:assert/strict";
import test from "node:test";
import { applyReusableValuations,automaticValuationResearchIssues,automaticValuationResearchReady,copiedValuation,inValuationBatches,reusableValuation,valuationBatchSize,valuationBudgetStatus,valuationMonitorPriority,valuationNeedsMonitoring,valuationQuantityPriority,valuationRefreshDays,valuationWorkPlan } from "../lib/valuation-monitor";
import type { InventoryItem,Valuation } from "../lib/types";

const item:InventoryItem={inventoryId:"I1",brand:"Cohiba",line:"Siglo IV",vitola:"Marevas",currentQty:20,retailValue:50,priority:"High"};
const valuation=(date:string,overrides:Partial<Valuation>={}):Valuation=>({valuationId:`V-${date}`,inventoryId:"I1",valuationDate:date,replacementValue:50,marketValue:60,source:"Retailer",sourceUrl:"https://example.com/cigar",confidence:"High",...overrides});

test("supported valuations refresh monthly",()=>{const regular={...item,brand:"Foundation",line:"Olmec",priority:"Normal" as const};assert.equal(valuationRefreshDays(item),30);assert.equal(valuationRefreshDays(regular),30);assert.equal(valuationNeedsMonitoring(item,[valuation("2026-06-21")],new Date("2026-07-21")),true);assert.equal(valuationNeedsMonitoring(item,[valuation("2026-06-22")],new Date("2026-07-21")),false)});
test("unsupported research waits 180 days",()=>{const unsupported=valuation("2026-01-22",{marketValue:undefined,replacementValue:undefined,notes:"Insufficient evidence"});assert.equal(valuationRefreshDays(item,unsupported),180);assert.equal(valuationNeedsMonitoring(item,[unsupported],new Date("2026-07-21")),true)});
test("structured insufficient evidence waits 180 days without relying on note wording",()=>{const unsupported=valuation("2026-07-20",{marketValue:undefined,marketEvidenceType:"Insufficient evidence",notes:"No exact public transactions."});assert.equal(valuationRefreshDays(item,unsupported),180);assert.equal(valuationNeedsMonitoring(item,[unsupported],new Date("2026-07-21")),false)});
test("fresh incomplete research retries immediately unless evidence was insufficient",()=>{const incomplete=valuation("2026-07-20",{replacementValue:undefined});assert.equal(valuationNeedsMonitoring({...item,retailValue:undefined},[incomplete],new Date("2026-07-21")),true);assert.equal(valuationNeedsMonitoring({...item,retailValue:undefined},[valuation("2026-07-20",{replacementValue:undefined,marketValue:undefined,notes:"Insufficient evidence"})],new Date("2026-07-21")),false)});
test("empty or incomplete lots are skipped",()=>{assert.equal(valuationNeedsMonitoring({...item,currentQty:0},[]),false);assert.equal(valuationNeedsMonitoring({...item,vitola:"Unknown"},[]),false)});
test("current source-linked retail evidence is reusable for every exact matching user",()=>{const other={...item,inventoryId:"I1",packaging:"Box of 20"};const reused=reusableValuation({...item,packaging:"Single"},[{item:other,valuation:valuation("2026-07-01",{replacementValue:50})}],new Date("2026-07-21"));assert.equal(reused?.replacementValue,50);assert.equal(reusableValuation(item,[{item:other,valuation:valuation("2026-07-01",{replacementValue:50,sourceUrl:undefined,confidence:"Low"})}],new Date("2026-07-21")),undefined);assert.equal(reusableValuation(item,[{item:{...other,vitola:"Robusto"},valuation:valuation("2026-07-01",{replacementValue:50})}],new Date("2026-07-21")),undefined);assert.equal(reusableValuation(item,[{item:{...other,vintage:2024},valuation:valuation("2026-07-01",{replacementValue:50})}],new Date("2026-07-21")),undefined)});
test("fresh valuation evidence remains reusable when the source lot retail field has not synchronized yet",()=>{const source={...item,retailValue:undefined};assert.equal(reusableValuation(item,[{item:source,valuation:valuation("2026-07-20")}],new Date("2026-07-21"))?.replacementValue,50)});
test("uploaded exact matches receive a fresh traceable valuation record",()=>{const copied=copiedValuation({...item,inventoryId:"NEW"},valuation("2026-07-01",{replacementValue:50}),new Date("2026-07-21T12:00:00Z"));assert.equal(copied.inventoryId,"NEW");assert.equal(copied.valuationDate,"2026-07-21");assert.equal(copied.replacementValue,50);assert.match(copied.notes||"",/reused during inventory upload/i)});
test("manual and photo intake apply exact-match values before the new inventory is saved",()=>{const incoming={...item,inventoryId:"NEW",retailValue:undefined};const result=applyReusableValuations([incoming],[item],[valuation("2026-07-20")],new Date("2026-07-21T12:00:00Z"));assert.equal(result.items[0].retailValue,50);assert.equal(result.valuedImmediately,1);assert.equal(result.valuations[0].inventoryId,"NEW");assert.equal(applyReusableValuations([{...incoming,vitola:"Robusto"}],[item],[valuation("2026-07-20")]).valuedImmediately,0)});
test("missing retail is completed before already priced lots",()=>{assert.equal(valuationMonitorPriority(item),11000);assert.ok(valuationMonitorPriority({...item,retailValue:undefined})>valuationMonitorPriority(item))});
test("collection components move ahead of otherwise equal inventory",()=>{const regular={...item,priority:"Normal" as const};assert.ok(valuationMonitorPriority({...regular,collectionId:"COL-1"})>valuationMonitorPriority(regular))});
test("unknown-price lots prioritize the largest quantity at risk",()=>{
 const single={...item,retailValue:undefined,currentQty:1,priority:"Normal" as const};
 const box={...single,inventoryId:"BOX",currentQty:50};
 assert.equal(valuationQuantityPriority(single),1000);
 assert.equal(valuationQuantityPriority(box),50000);
 assert.ok(valuationMonitorPriority(box)>valuationMonitorPriority(single));
 assert.ok(valuationMonitorPriority(box)>valuationMonitorPriority({...single,collectionId:"COL-1",priority:"High"}));
 assert.ok(valuationMonitorPriority({...box,currentQty:25})>valuationMonitorPriority({...single,collectionId:"COL-1",priority:"High"}));
});
test("valuation batches default to six and stay within safe limits",()=>{assert.equal(valuationBatchSize(),6);assert.equal(valuationBatchSize("50"),6);assert.equal(valuationBatchSize("0"),1);assert.equal(valuationBatchSize("invalid"),6)});
test("monthly estimated budget pauses before exceeding 80 percent",()=>{const events=[{created_at:"2026-07-01T00:00:00.000Z",properties:{estimatedCostUsd:6}},{created_at:"2026-06-01T00:00:00.000Z",properties:{estimatedCostUsd:99}},{created_at:"2026-07-02T00:00:00.000Z",properties:{estimatedCostUsd:4,cached:true}}];const status=valuationBudgetStatus(events,new Date("2026-07-21"),10,2.01);assert.equal(status.estimatedSpend,6);assert.equal(status.pauseAt,8);assert.equal(status.paused,true);assert.equal(status.remainingBeforePause,2)});
test("valuation work runs in bounded batches without losing order",async()=>{let active=0,peak=0;const results=await inValuationBatches([1,2,3,4,5],async value=>{active++;peak=Math.max(peak,active);await Promise.resolve();active--;return value*2},2);assert.deepEqual(results,[2,4,6,8,10]);assert.equal(peak,2)});
test("automatic research requires the Fox verification result and linked evidence",()=>{
  const research={replacementValue:25,marketValue:null,marketEvidenceType:"Insufficient evidence" as const,marketRangeLow:null,marketRangeHigh:null,askingPrice:null,askingPriceSource:"",askingPriceSourceUrl:"",lastSaleValue:null,lastSaleDate:null,lastSaleVenue:null,lastSaleSourceUrl:null,source:"Retailer",sourceUrl:"https://example.com/cigar",confidence:"Medium" as const,evidenceDate:"2026-07-29",notes:"Fox Cigar exact check found no usable listing.",comparables:[{title:"Exact retail",url:"https://example.com/cigar",unitPrice:25,kind:"Retail replacement" as const,notes:"Per cigar"}]};
  assert.equal(automaticValuationResearchReady(research),true);
  assert.match(automaticValuationResearchIssues({...research,notes:"Current retailer evidence."}).join(" "),/Fox Cigar/);
  assert.equal(automaticValuationResearchReady({...research,sourceUrl:""}),false);
});

test("valuation work remains inside the advertised total batch size even with cached evidence",()=>{
  const eligible=Array.from({length:10},(_,index)=>({userId:"U",item:{inventoryId:`I${index}`,brand:"Brand",line:`Line ${index}`,vitola:"Toro",currentQty:1}}));
  const candidates=eligible.map((row,index)=>({item:row.item,valuation:{valuationId:`V${index}`,inventoryId:row.item.inventoryId,valuationDate:"2026-07-29",replacementValue:20,sourceUrl:`https://example.com/${index}`,confidence:"Medium"}}));
  const work=valuationWorkPlan(eligible,candidates,6,6,new Date("2026-07-29T12:00:00Z"));
  assert.equal(work.length,6);
  assert.ok(work.every(row=>row.cached));
});

test("one run never pays twice for the same uncached cigar identity",()=>{
  const eligible=[
    {userId:"U",item:{inventoryId:"I1",brand:"Partagás",line:"Lusitanias",vitola:"Lusitania",currentQty:3}},
    {userId:"U",item:{inventoryId:"I2",brand:"Partagas",line:"Lusitanias",vitola:"Lusitania",currentQty:9}},
    {userId:"U",item:{inventoryId:"I3",brand:"Arturo Fuente",line:"OpusX",vitola:"Toro",currentQty:2}},
  ];
  const work=valuationWorkPlan(eligible,[],3,3);
  assert.deepEqual(work.map(row=>row.item.inventoryId),["I1","I3"]);
});
