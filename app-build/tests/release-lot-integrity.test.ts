import assert from "node:assert/strict";
import test from "node:test";
import { canonicalCigarIdentity } from "../lib/cigar-identity";
import { InventoryInputSchema } from "../lib/inventory-model";
import { canonicalVitolaName, physicalLotDesignation, releaseLotIntegrityIssues } from "../lib/physical-lot-identity";
import type { InventoryItem } from "../lib/types";

const lots: InventoryItem[] = [
  { inventoryId: "INV-0014", brand: "Arturo Fuente", line: "OpusX 25th Anniversary", vitola: "El Tributo", vintage: 2025, currentQty: 15, retailValue: 250, provenanceNotes: "Physical box 1 of 2" },
  { inventoryId: "INV-0015", brand: "Arturo Fuente", line: "OpusX 25th Anniversary", vitola: "El Tributo — Box 2", vintage: 2026, currentQty: 15, retailValue: 75, provenanceNotes: "Physical box 2 of 2" },
];

test("physical lot labels are separated from exact vitola identity", () => {
  assert.deepEqual(physicalLotDesignation("El Tributo — Box 2"), {
    canonicalVitola: "El Tributo", kind: "Box", number: 2, label: "Box 2",
  });
  assert.equal(canonicalVitolaName("Box Pressed Toro"), "Box Pressed Toro");
  assert.equal(canonicalVitolaName("Assorted / box"), "Assorted / box");
  assert.equal(canonicalVitolaName(46), "46");
  assert.equal(physicalLotDesignation(undefined), undefined);
  assert.equal(canonicalCigarIdentity(lots[0]).productKey, canonicalCigarIdentity(lots[1]).productKey);
  assert.notEqual(canonicalCigarIdentity(lots[0]).identityKey, canonicalCigarIdentity(lots[1]).identityKey);
});

test("release-aware audit preserves both lots and flags identity and value evidence review", () => {
  const snapshot = structuredClone(lots);
  const issues = releaseLotIntegrityIssues(lots);
  assert.deepEqual(lots, snapshot);
  assert.equal(lots.length, 2);
  assert.ok(issues.some(issue => issue.inventoryId === "INV-0015" && issue.code === "lot-label-in-vitola" && issue.suggestedVitola === "El Tributo"));
  assert.equal(issues.filter(issue => issue.code === "cross-release-value-gap").length, 2);
  assert.equal(issues.some(issue => issue.code === "release-year-missing"), false);
});

test("duplicate physical lots cannot save a numbered box as the vitola", () => {
  const result = InventoryInputSchema.safeParse(lots[1]);
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.error.issues[0]?.message ?? "", /physical-lot note/i);
});

test("a duplicate release without a year remains visible for correction", () => {
  const issues = releaseLotIntegrityIssues([{ ...lots[0], vintage: undefined }, { ...lots[1], vitola: "El Tributo" }]);
  assert.ok(issues.some(issue => issue.inventoryId === "INV-0014" && issue.code === "release-year-missing"));
});
