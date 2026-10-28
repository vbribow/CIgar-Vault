import assert from "node:assert/strict";
import test from "node:test";
import { recordRevision } from "../lib/record-revision";

test("record revisions ignore derived Vault creation metadata", () => {
  const stored = { inventoryId: "INV-0008", brand: "Arturo Fuente", currentQty: 1 };
  const loaded = { ...stored, addedAt: "2026-10-27T18:00:00.000Z" };

  assert.equal(recordRevision(loaded), recordRevision(stored));
});

test("record revisions still detect collector-data changes", () => {
  const original = { inventoryId: "INV-0008", currentQty: 1, addedAt: "2026-10-27T18:00:00.000Z" };
  const changed = { ...original, currentQty: 0 };

  assert.notEqual(recordRevision(changed), recordRevision(original));
});
