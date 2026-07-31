import assert from "node:assert/strict";
import test from "node:test";
import { mergeCatalogRecords } from "../lib/catalog";
import { canonicalCigarIdentity } from "../lib/cigar-identity";
import type { CatalogCigar, InventoryItem } from "../lib/types";

test("production catalog supplements master choices with owned cigar vitolas", () => {
  const master = [{ catalogId: "CAT-1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda" }] satisfies CatalogCigar[];
  const inventory = [
    { inventoryId: "INV-1", brand: "Cohíba", line: "Siglo IV", vitola: "Corona Gorda" },
    { inventoryId: "INV-2", brand: "Casa Fuente", line: "Casa Fuente", vitola: "Double Corona" },
  ] as InventoryItem[];

  const catalog = mergeCatalogRecords(master, inventory);

  assert.equal(catalog.length, 2);
  assert.equal(catalog[0].catalogId, "CAT-1");
  assert.deepEqual(catalog[1], {
    catalogId: canonicalCigarIdentity(inventory[1]).identityId,
    brand: "Casa Fuente",
    line: "Casa Fuente",
    vitola: "Double Corona",
  });
});
