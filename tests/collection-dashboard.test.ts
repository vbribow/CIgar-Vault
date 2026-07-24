import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCollection } from "../lib/collection-dashboard";

test("summarizes whole value, premium, completeness, and history", () => {
  const collection = {
    collectionId: "COL-FUENTE-PADRON-LEGENDS",
    name: "Fuente & Padrón Legends",
    expectedComponents: 2,
    wholeMarketValue: 1500,
  };
  const inventory = [
    { inventoryId: "A", brand: "Padrón", line: "Legends Carlos Fuente", vitola: "Toro", currentQty: 20, collectionId: collection.collectionId },
    { inventoryId: "B", brand: "Arturo Fuente", line: "Legends José Padrón", vitola: "Toro", currentQty: 20, collectionId: collection.collectionId },
  ];
  const valuations = [
    { valuationId: "V1", inventoryId: "A", valuationDate: "2026-01-01", marketValue: 20 },
    { valuationId: "V2", inventoryId: "B", valuationDate: "2026-01-01", marketValue: 25 },
  ];
  const result = summarizeCollection(collection, inventory, valuations);
  assert.equal(result.componentValue, 900);
  assert.equal(result.wholeValue, 1500);
  assert.equal(result.premium, 600);
  assert.equal(result.completionPercent, 100);
  assert.equal(result.missingComponents.length, 0);
  assert.equal(result.expectedCigars,40);
  assert.equal(result.valueEvidence,"Collection record");
  assert.equal(result.marketCoverage,2);
  assert.equal(result.completedSaleCoverage,0);
  assert.deepEqual(result.expectedContents,["20 Padrón-made cigars honoring Carlos A. Fuente, Sr.","20 Fuente-made cigars honoring José O. Padrón"]);
  assert.deepEqual(result.valueHistory, [{ date: "2026-01-01", value: 900 }]);
});

test("uses researched template value while keeping unsupported values visibly pending", () => {
  const researched = summarizeCollection({ collectionId: "COL-FUENTE-DREAM-DYNASTY", name: "From Dream to Dynasty Collection" }, [], []);
  assert.equal(researched.wholeValue, 2200);
  assert.equal(researched.valueEvidence, "Researched template");
  const unsupported = summarizeCollection({ collectionId: "COL-CUSTOM", name: "Custom Set" }, [], []);
  assert.equal(unsupported.wholeValue, 0);
  assert.equal(unsupported.valueEvidence, "Pending");
});

test("lists missing template components", () => {
  const result = summarizeCollection(
    { collectionId: "COL-PADRON-COLLECTION", name: "Padrón Collection" },
    [{ inventoryId: "A", brand: "Padrón", line: "1964 Anniversary Series", vitola: "Toro", currentQty: 1, collectionId: "COL-PADRON-COLLECTION" }],
    [],
  );
  assert.equal(result.completionPercent, 20);
  assert.equal(result.missingComponents.length, 4);
  assert.ok(result.missingComponents.includes("Family Reserve"));
});

test("subtracts fully priced original cigars from a humidor collection retail price", () => {
  const collection = { collectionId:"COL-FUENTE-PURPLE-DREAM", name:"Big Purple Dream Humidor" };
  const quantities=[10,6,10,10,10,10,10,10,20,10];
  const inventory=quantities.map((originalQty,index)=>({
    inventoryId:`P${index}`,brand:"Arturo Fuente",line:`OpusX component ${index}`,vitola:"Original release",
    originalQty,currentQty:Math.max(0,originalQty-1),retailValue:50,collectionId:collection.collectionId,
  }));
  const result=summarizeCollection(collection,inventory,[]);
  assert.equal(result.wholeValue,12975);
  assert.equal(result.cigarRetailValue,5300);
  assert.equal(result.humidorValue,7675);
  assert.equal(result.humidorValueStatus,"Calculated");
});

test("does not estimate a humidor residual until every included cigar has retail evidence", () => {
  const collection = { collectionId:"COL-FUENTE-PURPLE-DREAM", name:"Big Purple Dream Humidor" };
  const result=summarizeCollection(collection,[{inventoryId:"P1",brand:"Arturo Fuente",line:"Purple Rain",vitola:"Diadema",originalQty:10,currentQty:10,collectionId:collection.collectionId}],[]);
  assert.equal(result.humidorValue,undefined);
  assert.equal(result.humidorValueStatus,"Awaiting complete cigar retail values");
});
