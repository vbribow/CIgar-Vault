import assert from "node:assert/strict";
import test from "node:test";
import { findInventoryDuplicates, photoDraftId } from "../lib/photo-intake";
import { CigarVisionResultSchema, responseOutputText } from "../lib/cigar-vision";

const inventory = [
  { inventoryId: "INV-1", brand: "Arturo Fuente", line: "OpusX", vitola: "PerfecXion X", vintage: 2023 },
  { inventoryId: "INV-2", brand: "Arturo Fuente", line: "Don Carlos", vitola: "Double Robusto", vintage: 2023 },
  { inventoryId: "INV-3", brand: "Davidoff", line: "Grand Cru", vitola: "Toro" },
];

test("ranks exact inventory matches first", () => {
  const matches = findInventoryDuplicates({ brand: "arturo fuente", line: "OpusX", vitola: "PerfecXion X", vintage: "2023" }, inventory);
  assert.equal(matches[0]?.item.inventoryId, "INV-1");
  assert.equal(matches[0]?.score, 100);
});

test("does not warn for a brand-only match", () => {
  assert.deepEqual(findInventoryDuplicates({ brand: "Arturo Fuente", line: "Casa Cuba", vitola: "Divine Inspiration" }, inventory), []);
});

test("creates stable photo draft identifiers", () => {
  assert.equal(photoDraftId(1_000), "INV-PHOTO-RS");
});

test("extracts and validates structured vision output", () => {
  const value = { brand: "Cohiba", line: "Línea 1492", vitola: "Siglo IV", vintage: "2025", packaging: "Box of 25", fullBoxQty: 0, sticksPerBox: 25, looseStickQty: 20, boxCode: "BPM ABR 25", confidence: "high", evidenceSummary: "Bands and box label are visible.", uncertainties: [] };
  const text = responseOutputText({ output: [{ content: [{ type: "output_text", text: JSON.stringify(value) }] }] });
  assert.deepEqual(CigarVisionResultSchema.parse(JSON.parse(text!)), value);
});
