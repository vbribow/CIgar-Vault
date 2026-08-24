import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildVaultReviewTasks } from "../lib/vault-review";
import type { CatalogCigar, InventoryItem } from "../lib/types";

const lot = (patch: Partial<InventoryItem> = {}): InventoryItem => ({ inventoryId: "INV-TEST", brand: "Example", line: "Reserva", vitola: "Toro", currentQty: 10, fullBoxQty: 1, sticksPerBox: 10, looseStickQty: 0, storageLocationId: "HUM-1", provenanceNotes: "Purchased from a retailer", photoLink: "https://example.com/photo.jpg", vintage: 2026, retailValue: 12, score: 90, ...patch });
const catalog: CatalogCigar[] = [{ catalogId: "CAT-TEST", brand: "Example", line: "Reserva", vitola: "Toro", country: "Nicaragua", sourceUrl: "https://example.com/cigar" }];

test("Finish My Vault returns one highest-priority action per physical lot", () => {
  const tasks = buildVaultReviewTasks([
    lot({ inventoryId: "QTY", fullBoxQty: undefined, sticksPerBox: undefined, looseStickQty: undefined }),
    lot({ inventoryId: "STORE", storageLocationId: undefined, provenanceNotes: undefined, photoLink: undefined }),
  ], catalog);
  assert.equal(tasks.length, 2);
  const byLot = new Map(tasks.map(item => [item.inventoryId, item]));
  assert.equal(byLot.get("QTY")?.issue, "quantity");
  assert.equal(byLot.get("STORE")?.issue, "storage");
  assert.match(byLot.get("QTY")?.href || "", /\/inventory\/QTY\?focus=quantity/);
  assert.match(byLot.get("QTY")?.href || "", /searchReturn=/);
});

test("unknown optional facts remain optional and research carries a credit warning", () => {
  const photo = buildVaultReviewTasks([lot({ photoLink: undefined })], catalog)[0];
  assert.equal(photo.issue, "photo");
  assert.equal(photo.optional, true);
  const origin = buildVaultReviewTasks([lot({ score: undefined })], [catalog[0] ? { ...catalog[0], country: undefined } : catalog[0]!])[0];
  assert.equal(origin.issue, "origin");
  assert.match(origin.creditNotice || "", /no research credits/i);
  assert.match(origin.creditNotice || "", /separate/i);
});

test("a fully documented exact lot produces no forced work", () => {
  assert.deepEqual(buildVaultReviewTasks([lot()], catalog), []);
});

test("the guided UI offers direct action, skip, and finish-later controls", () => {
  const source = readFileSync(new URL("../components/finish-vault-review.tsx", import.meta.url), "utf8");
  assert.match(source, /One cigar and one decision at a time/);
  assert.match(source, /Skip for now/);
  assert.match(source, /Finish later/);
  assert.match(source, /No records were changed/);
});
