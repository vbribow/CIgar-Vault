import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildConciergeCandidates, estimatedSmokingTime, recommendForTime, recommendGuestFlight } from "../lib/cigar-somm-concierge";
import type { InventoryItem, SmokingLog } from "../lib/types";

const inventory: InventoryItem[] = [
  { inventoryId: "INV-1", brand: "Fuente", line: "OpusX", vitola: "Robusto", currentQty: 4 },
  { inventoryId: "INV-2", brand: "Padron", line: "1964", vitola: "Churchill", currentQty: 1, collectionId: "COL-1" },
  { inventoryId: "INV-3", brand: "Davidoff", line: "Signature", vitola: "Toro", currentQty: 3 },
];
const smokes: SmokingLog[] = [
  { smokeId: "SMK-1", inventoryId: "INV-1", dateSmoked: "2026-08-01", overall: 94, strength: "Medium-full", flavor: "Cedar", buyAgain: true },
  { smokeId: "SMK-2", inventoryId: "INV-1", dateSmoked: "2026-08-02", overall: 92, strength: "Medium-full", flavor: "Cedar", buyAgain: true },
];

test("private concierge summarizes exact-lot smoking evidence without inventing missing ratings", () => {
  const candidates = buildConciergeCandidates(inventory, smokes);
  assert.equal(candidates[0].averageScore, 93);
  assert.equal(candidates[0].experienceCount, 2);
  assert.equal(candidates[1].averageScore, undefined);
});
test("time guidance is explicitly estimated and respects the selected window", () => {
  assert.match(estimatedSmokingTime("Unknown shape").basis, /exact duration is not documented/);
  assert.deepEqual(recommendForTime(buildConciergeCandidates(inventory, smokes), 45).map((value) => value.item.inventoryId), ["INV-1"]);
});

test("guest planning protects collection components and requires enough standalone cigars", () => {
  assert.deepEqual(recommendGuestFlight(buildConciergeCandidates(inventory, smokes), 3).map((value) => value.item.inventoryId), ["INV-1", "INV-3"]);
});

test("Cigar Somm exposes four local, no-research-charge decision paths", () => {
  const component = readFileSync(new URL("../components/cigar-somm-concierge.tsx", import.meta.url), "utf8");
  assert.match(component, /What should I smoke now/);
  assert.match(component, /Plan for guests or a flight/);
  assert.match(component, /Compare two cigars/);
  assert.match(component, /Choose by available time/);
  assert.match(component, /no AI research charge/);
  assert.match(component, /No Vault notes are sent/);
});
