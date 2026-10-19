import assert from "node:assert/strict";
import test from "node:test";
import { buildPortfolioHistory } from "../lib/portfolio-history";

test("builds portfolio snapshots and lot-level movers", () => {
  const inventory = [{ inventoryId:"I1", brand:"Cohiba", line:"Siglo IV", vitola:"Marevas", currentQty:20, actualCost:500 }];
  const valuations = [{ valuationId:"V1", inventoryId:"I1", valuationDate:"2025-01-01", marketValue:40 }, { valuationId:"V2", inventoryId:"I1", valuationDate:"2026-01-01", marketValue:50 }];
  const result = buildPortfolioHistory(inventory, valuations);
  assert.deepEqual(result.snapshots.map(row => row.value), [800, 1000]);
  assert.equal(result.totals.currentValue, 1000);
  assert.equal(result.totals.unrealizedChange, 500);
  assert.equal(result.movers[0].changePercent, 25);
  assert.equal(result.movers[0].lotChange, 200);
});

test("falls back to retail value for current allocation without market evidence", () => {
  const result = buildPortfolioHistory([{ inventoryId:"I2", brand:"Fuente", line:"OpusX", vitola:"Toro", currentQty:5, retailValue:30 }], []);
  assert.equal(result.totals.currentValue, 150);
  assert.equal(result.brandAllocation[0].value, 150);
  assert.equal(result.totals.coverage, 0);
});

test("collection presentation value is never added to cigar portfolio value", () => {
  const collection = {
    collectionId:"COL-1",
    name:"Numbered Humidor",
    presentationInventoryId:"CASE",
  };
  const result = buildPortfolioHistory([
    { inventoryId:"CASE", brand:"Maker", line:"Numbered Humidor", vitola:"Presentation asset", currentQty:1, retailValue:12975 },
    { inventoryId:"CIGAR", collectionId:"COL-1", brand:"Maker", line:"Reserva", vitola:"Toro", currentQty:10, retailValue:50 },
  ], [], [collection]);
  assert.equal(result.totals.currentValue, 500);
  assert.deepEqual(result.brandAllocation, [{brand:"Maker",value:500,percent:100}]);
});

test("documented collection value replaces linked components without double counting",()=>{
  const collection={collectionId:"COL-2",name:"House of Dreams",maker:"Fuente × Elie Bleu",ownedSetQty:1,wholeMarketValue:20000,valuationDate:"2024-08-20"};
  const result=buildPortfolioHistory([
    {inventoryId:"CIGARS",collectionId:"COL-2",brand:"Fuente",line:"Hemingway OpusX",vitola:"Perfecto",currentQty:60,retailValue:100},
    {inventoryId:"LOOSE",brand:"Fuente",line:"Don Carlos",vitola:"Robusto",currentQty:2,retailValue:25},
  ],[],[collection]);
  assert.equal(result.totals.currentValue,20050);
  assert.deepEqual(result.snapshots.map(point=>point.value),[20050]);
  assert.deepEqual(result.brandAllocation,[
    {brand:"Fuente × Elie Bleu",value:14000,percent:69.8},
    {brand:"Fuente",value:6050,percent:30.2},
  ]);
});

test("two owned sets multiply documented whole-collection value once per set",()=>{
  const result=buildPortfolioHistory([],[],[{collectionId:"COL-3",name:"Stairway",ownedSetQty:2,wholeMarketValue:12500,valuationDate:"2026-01-01"}]);
  assert.equal(result.totals.currentValue,25000);
});

test("an already-saved researched collection inherits its documented template value",()=>{
  const result=buildPortfolioHistory([],[],[{
    collectionId:"COL-FUENTE-HEMINGWAY-HOUSE-DREAMS",
    name:"Hemingway House of Dreams Humidor",
    ownedSetQty:1,
  }]);
  assert.equal(result.totals.currentValue,20000);
});
