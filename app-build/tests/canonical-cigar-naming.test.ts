import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeInventoryNaming } from "../lib/canonical-cigar-naming";
import type { CatalogCigar, InventoryItem } from "../lib/types";

function item(values: Partial<InventoryItem>): InventoryItem {
  return { inventoryId: "INV-TEST", brand: "Test", line: "Test", vitola: "Test", ...values };
}

test("canonical naming corrects the live Drew Estate T52 entry from its primary-source identity", () => {
  const corrected = canonicalizeInventoryNaming(item({ brand: "Drew state", line: "Liga T 52", vitola: "robusto" }));
  assert.deepEqual(
    { brand: corrected.brand, line: corrected.line, vitola: corrected.vitola },
    { brand: "Drew Estate", line: "Liga Privada T52", vitola: "Robusto" },
  );
});

test("canonical naming uses the exact catalog spelling and attaches its catalog ID", () => {
  const catalog: CatalogCigar[] = [{ catalogId: "CAT-1", brand: "Padrón", line: "1964 Anniversary Series", vitola: "Exclusivo" }];
  const corrected = canonicalizeInventoryNaming(item({ brand: "Padron", line: "1964 anniversary series", vitola: "Exclusiv" }), catalog);
  assert.equal(corrected.brand, "Padrón");
  assert.equal(corrected.line, "1964 Anniversary Series");
  assert.equal(corrected.vitola, "Exclusivo");
  assert.equal(corrected.catalogId, "CAT-1");
});

test("canonical naming removes a stale catalog ID when the corrected cigar has no exact match", () => {
  const catalog: CatalogCigar[] = [{ catalogId: "CAT-LANCERO", brand: "Arturo Fuente", line: "Casa Fuente", vitola: "Lancero" }];
  const corrected = canonicalizeInventoryNaming(item({ catalogId: "CAT-LANCERO", brand: "Arturo Fuente", line: "Casa Fuente", vitola: "Toro" }), catalog);
  assert.equal(corrected.vitola, "Toro");
  assert.equal(corrected.catalogId, undefined);
});

test("a genuinely unknown documented cigar remains available for exact manual entry", () => {
  const original = item({ brand: "Small Batch Maker", line: "Founder's Release", vitola: "Toro Grande" });
  assert.deepEqual(canonicalizeInventoryNaming(original), original);
});
