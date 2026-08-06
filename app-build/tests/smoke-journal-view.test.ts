import assert from "node:assert/strict";
import test from "node:test";
import { buildSmokeJournalEntries, filterSmokeJournalEntries } from "../lib/smoke-journal-view";
import type { InventoryItem, SmokingLog } from "../lib/types";

const inventory: InventoryItem[] = [{ inventoryId: "INV-7", brand: "Arturo Fuente", line: "OpusX", vitola: "Robusto", vintage: 2020 }];
const smokes: SmokingLog[] = [
  { smokeId: "SMK-2", inventoryId: "MANUAL", cigarName: "Guest cigar", dateSmoked: "2026-08-04", flavor: "Cedar, Coffee", tastingNotes: "Shared at the lounge" },
  { smokeId: "SMK-1", inventoryId: "INV-7", dateSmoked: "2026-08-03", overall: 94, strength: "Medium–full", buyAgain: true },
];

test("builds newest-first journal entries and resolves exact Vault cigars", () => {
  const entries = buildSmokeJournalEntries(smokes, inventory);
  assert.deepEqual(entries.map(entry => entry.title), ["Guest cigar", "Arturo Fuente OpusX"]);
  assert.equal(entries[1].item?.inventoryId, "INV-7");
  assert.equal(entries[1].detail, "Robusto · 2020");
});

test("searches personal notes and filters Vault versus review-only smokes", () => {
  const entries = buildSmokeJournalEntries(smokes, inventory);
  assert.deepEqual(filterSmokeJournalEntries(entries, "lounge", "all").map(entry => entry.smoke.smokeId), ["SMK-2"]);
  assert.deepEqual(filterSmokeJournalEntries(entries, "medium", "vault").map(entry => entry.smoke.smokeId), ["SMK-1"]);
  assert.deepEqual(filterSmokeJournalEntries(entries, "", "review").map(entry => entry.smoke.smokeId), ["SMK-2"]);
});
