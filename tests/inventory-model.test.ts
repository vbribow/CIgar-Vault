import assert from "node:assert/strict";
import test from "node:test";
import { InventoryInputSchema, inventoryCompleteness, normalizeInventory } from "../lib/inventory-model";

test("remaining quantity is derived from original and smoked quantities", () => {
  const item = normalizeInventory({ inventoryId: "INV-1", brand: "Test", line: "Line", vitola: "Toro", originalQty: 10, smokedQty: 3 });
  assert.equal(item.currentQty, 7);
});

test("box and loose-stick quantities produce a total cigar count", () => {
  const item = normalizeInventory({ inventoryId: "INV-BOX", brand: "Test", line: "Line", vitola: "Toro", fullBoxQty: 2, sticksPerBox: 25, looseStickQty: 4, smokedQty: 3 });
  assert.equal(item.originalQty, 54);
  assert.equal(item.currentQty, 51);
});

test("a full-box quantity requires cigars per box", () => {
  const result = InventoryInputSchema.safeParse({ inventoryId: "INV-BOX", brand: "Test", line: "", vitola: "Toro", fullBoxQty: 1 });
  assert.equal(result.success, false);
});

test("validation rejects smoked quantities above the original quantity", () => {
  const result = InventoryInputSchema.safeParse({ inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro", originalQty: 2, smokedQty: 3 });
  assert.equal(result.success, false);
});

test("completeness reflects the five launch-critical fields", () => {
  assert.equal(inventoryCompleteness({ inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro", originalQty: 10, currentQty: 10, vintage: 2024 }), 60);
});

test("Cuban verification accepts a box code and seal photo URL", () => {
  const parsed = InventoryInputSchema.parse({ inventoryId: "INV-CU", brand: "Cohiba", line: "Robustos", vitola: "Robusto", boxCode: "AMO OCT 16", habanosSealPhotoLink: "https://example.com/seal.jpg" });
  assert.equal(parsed.boxCode, "AMO OCT 16");
  assert.equal(parsed.habanosSealPhotoLink, "https://example.com/seal.jpg");
});
