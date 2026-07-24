import assert from "node:assert/strict";
import test from "node:test";
import { collectionComponentMarketEvidence } from "../lib/collection-market-evidence";
import type { InventoryItem, Valuation } from "../lib/types";

const component: InventoryItem = { inventoryId: "COL-C1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda", vintage: 2025, currentQty: 20, collectionId: "COL-1" };
const standalone: InventoryItem = { ...component, inventoryId: "INV-1", collectionId: undefined };
const sourced: Valuation = { valuationId: "VAL-1", inventoryId: "INV-1", valuationDate: "2026-07-23", replacementValue: 60, marketValue: 72, lastSaleValue: 75, lastSaleDate: "2026-07-01", lastSaleSourceUrl: "https://example.com/sold", source: "Authorized retailer", sourceUrl: "https://example.com/retail", confidence: "High" };

test("collection components reuse exact-identity retail, market, and completed-sale evidence", () => {
  const evidence = collectionComponentMarketEvidence(component, [component, standalone], [sourced]);
  assert.equal(evidence.retailUnit, 60);
  assert.equal(evidence.marketUnit, 72);
  assert.equal(evidence.valueUnit, 72);
  assert.equal(evidence.completedSale?.lastSaleValue, 75);
  assert.equal(evidence.reusedFromInventoryId, "INV-1");
});

test("nearby vitolas and unproved completed sales are never connected automatically", () => {
  const nearby = { ...standalone, vitola: "Robusto" };
  assert.equal(collectionComponentMarketEvidence(component, [component, nearby], [sourced]).valueUnit, undefined);
  const unproved = { ...sourced, lastSaleSourceUrl: undefined };
  assert.equal(collectionComponentMarketEvidence(component, [component, standalone], [unproved]).completedSale, undefined);
});
