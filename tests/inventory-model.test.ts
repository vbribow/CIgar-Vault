import assert from "node:assert/strict";
import test from "node:test";
import { InventoryInputSchema, inventoryCompleteness, normalizeInventory } from "../lib/inventory-model";

test("remaining quantity is derived from original and smoked quantities", () => {
  const item = normalizeInventory({ inventoryId: "INV-1", brand: "Test", line: "Line", vitola: "Toro", originalQty: 10, smokedQty: 3 });
  assert.equal(item.currentQty, 7);
});

test("validation rejects smoked quantities above the original quantity", () => {
  const result = InventoryInputSchema.safeParse({ inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro", originalQty: 2, smokedQty: 3 });
  assert.equal(result.success, false);
});

test("completeness reflects the five launch-critical fields", () => {
  assert.equal(inventoryCompleteness({ inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro", originalQty: 10, currentQty: 10, vintage: 2024 }), 60);
});
