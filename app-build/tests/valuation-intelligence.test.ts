import test from "node:test";
import assert from "node:assert/strict";
import { buildValuationIntelligence, valuationFreshness } from "../lib/valuation-intelligence";
import type { InventoryItem, Valuation } from "../lib/types";

test("classifies valuation age on a 120 and 180 day review policy", () => {
  const now = new Date("2026-07-21T12:00:00Z");
  assert.equal(valuationFreshness("2026-06-01", now), "Current");
  assert.equal(valuationFreshness("2026-03-01", now), "Due soon");
  assert.equal(valuationFreshness("2025-12-01", now), "Stale");
  assert.equal(valuationFreshness(undefined, now), "Never valued");
});

test("calculates unit change and prioritizes stale evidence", () => {
  const inventory: InventoryItem[] = [{ inventoryId: "I1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda", currentQty: 25, retailValue: 55 }];
  const valuations: Valuation[] = [
    { valuationId: "V2", inventoryId: "I1", valuationDate: "2026-01-01", marketValue: 60, source: "Auction" },
    { valuationId: "V1", inventoryId: "I1", valuationDate: "2025-06-01", marketValue: 50, source: "Auction", sourceUrl: "https://example.com/old" },
  ];
  const result = buildValuationIntelligence(inventory, valuations, new Date("2026-07-21T12:00:00Z"));
  assert.equal(result.rows[0].changePercent, 20);
  assert.equal(result.rows[0].marketLot, 1500);
  assert.equal(result.rows[0].freshness, "Stale");
  assert.equal(result.reviewQueue.length, 1);
});

test("keeps retail replacement separate from documented aftermarket value and reports coverage",()=>{
 const inventory:InventoryItem[]=[
  {inventoryId:"R",brand:"Padron",line:"1964",vitola:"Exclusivo",currentQty:10,retailValue:20},
  {inventoryId:"M",brand:"Cohiba",line:"Siglo IV",vitola:"Corona Gorda",currentQty:5,retailValue:50},
 ];
 const valuations:Valuation[]=[{valuationId:"V",inventoryId:"M",valuationDate:"2026-07-01",replacementValue:50,marketValue:70,lastSaleValue:75,lastSaleDate:"2026-06-01",lastSaleSourceUrl:"https://example.com/sold",sourceUrl:"https://example.com/value"}];
 const result=buildValuationIntelligence(inventory,valuations,new Date("2026-07-21"));
 assert.equal(result.totals.retailReplacementValue,450);
 assert.equal(result.totals.documentedMarketValue,350);
 assert.equal(result.totals.retailCoveragePercent,100);
 assert.equal(result.totals.marketCoveragePercent,50);
 assert.equal(result.totals.saleCoveragePercent,50);
 assert.deepEqual(result.rows[0].missingEvidence,["Aftermarket evidence","Retail consensus","Linked source"]);
});

test("uses retail consensus for New World coverage while retaining the Habanos sale standard",()=>{
 const inventory:InventoryItem[]=[
  {inventoryId:"NW",brand:"Arturo Fuente",line:"OpusX",vitola:"Reserva d'Chateau",currentQty:2},
  {inventoryId:"CU",brand:"Cohiba",line:"Siglo VI",vitola:"Cañonazo",currentQty:2},
 ];
 const valuations:Valuation[]=[
  {valuationId:"NW-V",inventoryId:"NW",valuationDate:"2026-07-29",marketEvidenceType:"Retail consensus value",marketValue:55,marketRangeLow:50,marketRangeHigh:60,comparableCount:2,sourceUrl:"https://example.com/retail",confidence:"Medium"},
  {valuationId:"CU-V",inventoryId:"CU",valuationDate:"2026-07-29",marketEvidenceType:"Retail consensus value",marketValue:90,marketRangeLow:85,marketRangeHigh:95,comparableCount:2,sourceUrl:"https://example.com/retail",confidence:"Medium"},
 ];
 const result=buildValuationIntelligence(inventory,valuations,new Date("2026-07-29"));
 assert.equal(result.rows.find(row=>row.item.inventoryId==="NW")?.standardCovered,true);
 assert.equal(result.rows.find(row=>row.item.inventoryId==="CU")?.standardCovered,false);
 assert.equal(result.totals.standardCoveragePercent,50);
});

test("current insufficient evidence is a trusted result, not an immediate retry loop",()=>{
 const inventory:InventoryItem[]=[{inventoryId:"N",brand:"Foundation",line:"Olmec",vitola:"Toro",currentQty:5,retailValue:16}];
 const valuations:Valuation[]=[{valuationId:"V",inventoryId:"N",valuationDate:"2026-07-20",replacementValue:16,marketEvidenceType:"Insufficient evidence",confidence:"Low",notes:"No exact public secondary evidence."}];
 const result=buildValuationIntelligence(inventory,valuations,new Date("2026-07-24"));
 assert.equal(result.rows[0].evidenceType,"Insufficient evidence");
 assert.equal(result.reviewQueue.length,0);
});

test("zero-quantity historical lots can be excluded from active portfolio coverage",()=>{
 const active:InventoryItem={inventoryId:"A",brand:"Cohiba",line:"Siglo IV",vitola:"Corona Gorda",currentQty:20,retailValue:50};
 const historical:InventoryItem={inventoryId:"H",brand:"Cohiba",line:"Siglo IV",vitola:"Corona Gorda",currentQty:0};
 const result=buildValuationIntelligence([active,historical].filter(item=>(item.currentQty??0)>0),[]);
 assert.equal(result.totals.totalLots,1);
 assert.equal(result.totals.retailCoveragePercent,100);
});

test("latest verified sale is derived from complete proof across retained history",()=>{
 const inventory:InventoryItem[]=[{inventoryId:"I",brand:"Hoyo de Monterrey",line:"Epicure Especial",vitola:"Gordito",currentQty:10}];
 const valuations:Valuation[]=[
  {valuationId:"NEW",inventoryId:"I",valuationDate:"2026-07-20",lastSaleValue:52,source:"Completed sale mentioned by source"},
  {valuationId:"OLD",inventoryId:"I",valuationDate:"2026-06-20",lastSaleValue:48,lastSaleDate:"2026-06-15",lastSaleSourceUrl:"https://example.com/sold-lot"},
 ];
 const result=buildValuationIntelligence(inventory,valuations,new Date("2026-07-24"));
 assert.equal(result.rows[0].latest?.valuationId,"NEW");
 assert.equal(result.rows[0].latestVerifiedSale?.valuationId,"OLD");
 assert.equal(result.rows[0].latestLegacySaleClaim?.valuationId,"NEW");
 assert.equal(result.totals.saleCovered,1);
});

test("the visible research queue puts higher unknown quantity at risk first",()=>{
 const inventory:InventoryItem[]=[
  {inventoryId:"ONE",brand:"Brand",line:"Rare",vitola:"Toro",currentQty:1},
  {inventoryId:"FIFTY",brand:"Brand",line:"Regular",vitola:"Robusto",currentQty:50},
 ];
 const result=buildValuationIntelligence(inventory,[]);
 assert.deepEqual(result.reviewQueue.map(row=>row.item.inventoryId),["FIFTY","ONE"]);
});
