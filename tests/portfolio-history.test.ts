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
