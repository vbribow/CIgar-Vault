import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { isActiveInventoryHolding, isCurrentInventoryRecord } from "../lib/inventory-model";
import type { InventoryItem } from "../lib/types";

const base: InventoryItem = { inventoryId: "I1", brand: "Example", line: "Reserva", vitola: "Toro" };

test("current holdings distinguish active, uncounted, and consumed records", () => {
  assert.equal(isCurrentInventoryRecord({ ...base, currentQty: 4 }), true);
  assert.equal(isActiveInventoryHolding({ ...base, currentQty: 4 }), true);
  assert.equal(isCurrentInventoryRecord({ ...base, currentQty: undefined }), true);
  assert.equal(isActiveInventoryHolding({ ...base, currentQty: undefined }), false);
  assert.equal(isCurrentInventoryRecord({ ...base, currentQty: 0 }), false);
  assert.equal(isActiveInventoryHolding({ ...base, currentQty: 0 }), false);
});

test("homepage highlights and cellar guidance use only active holdings", () => {
  const dashboard = readFileSync(new URL("../components/dashboard.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /const featured = \[\.\.\.active\]/);
  assert.match(dashboard, /const aging = active\.filter/);
  assert.match(dashboard, /Highest-scored cigars currently in the vault/);
});
