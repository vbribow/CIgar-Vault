import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inventorySmokeEvidence, matchesCollectionExplorer } from "@/lib/collection-explorer";
import type { InventoryItem, SmokingLog } from "@/lib/types";

const item: InventoryItem = { inventoryId: "INV-1", brand: "Example", line: "Reserva", vitola: "Robusto" };
const smokes: SmokingLog[] = [
  { smokeId: "S-1", inventoryId: "INV-1", dateSmoked: "2026-09-01", strength: "Medium", flavor: "Cocoa, cedar", tastingNotes: "Creamy finish", overall: 92, buyAgain: true },
  { smokeId: "S-2", inventoryId: "INV-1", outsideInventory: true, dateSmoked: "2026-09-03", strength: "Full", flavor: "Pepper", overall: 99, buyAgain: false },
];
const base = { strength: "all", experience: "", vitola: "all", minimumRating: "all", buyAgain: "all" as const };

describe("private collection explorer", () => {
  it("uses only smoking evidence connected to the exact Vault record", () => assert.deepEqual(inventorySmokeEvidence(item, smokes).map(smoke => smoke.smokeId), ["S-1"]));
  it("combines recorded experience and inventory filters", () => {
    assert.equal(matchesCollectionExplorer(item, smokes, { ...base, vitola: "Robusto", strength: "Medium", experience: "cedar creamy", minimumRating: "90", buyAgain: "yes" }), true);
    assert.equal(matchesCollectionExplorer(item, smokes, { ...base, strength: "Full" }), false);
    assert.equal(matchesCollectionExplorer(item, smokes, { ...base, experience: "pepper" }), false);
    assert.equal(matchesCollectionExplorer(item, smokes, { ...base, minimumRating: "95" }), false);
  });
  it("does not turn missing experience data into a match", () => {
    const unrated = { ...item, inventoryId: "INV-2" };
    assert.equal(matchesCollectionExplorer(unrated, smokes, { ...base, strength: "Medium" }), false);
    assert.equal(matchesCollectionExplorer(unrated, smokes, base), true);
  });
});
