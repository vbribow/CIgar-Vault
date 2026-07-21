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
