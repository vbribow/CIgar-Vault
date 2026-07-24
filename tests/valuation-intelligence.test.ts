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
 assert.deepEqual(result.rows[0].missingEvidence,["Aftermarket estimate","Completed sale","Linked source"]);
});
