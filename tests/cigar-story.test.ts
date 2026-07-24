import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildCigarStory, cigarStoryHref, cigarStoryId } from "../lib/cigar-story";
import type { InventoryItem, ProfessionalRating, Valuation } from "../lib/types";

const lot: InventoryItem = { inventoryId: "INV-1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda", vintage: 2025, currentQty: 20, retailValue: 60, collectionId: "COL-1" };
const second: InventoryItem = { ...lot, inventoryId: "INV-2", currentQty: 2, retailValue: undefined, collectionId: undefined };
const value: Valuation = { valuationId: "VAL-1", inventoryId: "INV-1", valuationDate: "2026-07-23", replacementValue: 60, marketValue: 72, lastSaleValue: 75, lastSaleDate: "2026-07-01", lastSaleSourceUrl: "https://example.com/sale", sourceUrl: "https://example.com/value", confidence: "High" };
const rating: ProfessionalRating = { ratingId: "R-1", inventoryId: "INV-2", publication: "Journal", score: 94, sourceUrl: "https://example.com/rating", matchConfidence: "High", createdAt: "2026-07-23T00:00:00Z" };

test("Unified Cigar Story aggregates exact-identity lots without merging another vintage", () => {
  const story = buildCigarStory({
    identityId: cigarStoryId(lot),
    inventory: [lot, second, { ...lot, inventoryId: "INV-3", vintage: 2024, currentQty: 10 }],
    valuations: [value],
    smokes: [{ smokeId: "S-1", inventoryId: "INV-2", dateSmoked: "2026-07-20", overall: 96 }],
    ratings: [rating],
    collections: [{ collectionId: "COL-1", name: "Cohiba Collection" }],
  });
  assert.equal(story?.lots.length, 2);
  assert.equal(story?.quantity, 22);
  assert.equal(story?.retailLotValue, 1320);
  assert.equal(story?.completedSale?.lastSaleValue, 75);
  assert.equal(story?.personalAverage, 96);
  assert.equal(story?.publishedAverage, 94);
  assert.equal(story?.collections[0].name, "Cohiba Collection");
});

test("inventory records link to one stable shared Cigar Story", () => {
  assert.match(cigarStoryHref(lot), /^\/cigars\/CIG-/);
  const detail = readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");
  assert.match(detail, /Open unified Cigar Story/);
});
