import assert from "node:assert/strict";
import test from "node:test";
import inventory from "../data/inventory.json";

test("INV-0020 preserves the collector-confirmed Natural variant", () => {
  const item = inventory.find(record => record.inventoryId === "INV-0020");
  assert.ok(item);
  assert.equal(item.vitola, "BBMF Natural");
});
