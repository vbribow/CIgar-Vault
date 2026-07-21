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
  assert.deepEqual(result.valueHistory, [{ date: "2026-01-01", value: 900 }]);
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
