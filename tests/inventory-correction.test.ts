import assert from "node:assert/strict";
import test from "node:test";
import { applyCorrectionSuggestions, correctionSuggestions } from "../lib/inventory-correction";
import type { CigarVisionResult } from "../lib/cigar-vision";
import type { InventoryItem } from "../lib/types";

const item: InventoryItem = { inventoryId: "INV-1", brand: "Arturo Fuente", line: "Casa Fuente", vitola: "Lancero", fullBoxQty: 1, sticksPerBox: 10, smokedQty: 0 };
const result: CigarVisionResult = { brand: "Arturo Fuente", line: "Casa Fuente", vitola: "Double Corona", vintage: null, packaging: "Box of 10", fullBoxQty: null, sticksPerBox: 10, looseStickQty: null, boxCode: null, confidence: "high", evidenceSummary: "Band and box identify the cigar.", uncertainties: [] };

test("record correction suppresses blank and unchanged AI fields", () => {
  assert.deepEqual(correctionSuggestions(item, result).map(change => change.field), ["vitola", "packaging"]);
});

test("record correction applies only explicitly approved fields", () => {
  const updated = applyCorrectionSuggestions(item, result, ["vitola"]);
  assert.equal(updated.vitola, "Double Corona");
  assert.equal(updated.packaging, undefined);
  assert.equal(updated.sticksPerBox, 10);
});
