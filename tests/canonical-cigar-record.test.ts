import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalCigarRecord, canonicalCatalogHref } from "../lib/canonical-cigar-record";
import type { CatalogCigar, InventoryItem } from "../lib/types";

test("canonical record preserves unknown product facts as visible research gaps", () => {
  const record = buildCanonicalCigarRecord({
    catalogId: "CAT-1",
    brand: "Perdomo",
    line: "20th Anniversary",
    vitola: "Epicure",
  });

  assert.equal(record.brand, "Perdomo");
  assert.equal(record.manufacturing.productFactory, undefined);
  assert.equal(record.manufacturing.status, "Factory verified");
  assert.match(record.manufacturing.caution, /not automatically assigned/i);
  assert.ok(record.researchGaps.includes("Wrapper"));
  assert.ok(record.researchGaps.includes("Exact product factory"));
});

test("canonical record connects structured product evidence and matching collector lots", () => {
  const catalog: CatalogCigar = {
    catalogId: "CAT-2",
    brand: "Example Cigars",
    line: "Reserva",
    vitola: "Toro",
    country: "Nicaragua",
    factory: "Example Factory",
    wrapper: "Habano",
    binder: "Nicaraguan",
    filler: "Nicaraguan",
    dimensions: "6 × 52",
    msrp: 14,
    sourceUrl: "https://example.com/reserva",
    sourceName: "Official product page",
    sourceType: "Official",
    confidence: "High",
    verifiedAt: "2026-07-23",
  };
  const inventory = [{ inventoryId: "INV-1", catalogId: "CAT-2", brand: "Example Cigars", line: "Reserva", vitola: "Toro", currentQty: 5 }] satisfies InventoryItem[];
  const record = buildCanonicalCigarRecord(catalog, inventory);

  assert.equal(record.manufacturing.productFactory, "Example Factory");
  assert.equal(record.evidence[0].sourceType, "Official");
  assert.equal(record.ownedLots.length, 1);
  assert.equal(record.release.find((item) => item.key === "msrp")?.value, "$14.00");
  assert.equal(canonicalCatalogHref("CAT 2"), "/catalog/CAT%202");
});
