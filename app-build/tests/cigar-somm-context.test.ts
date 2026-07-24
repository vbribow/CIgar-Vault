import assert from "node:assert/strict";
import test from "node:test";
import { buildCigarSommCollectorContext } from "../lib/cigar-somm-context";

test("collector context summarizes private records and selected cigar stewardship", () => {
  const context = buildCigarSommCollectorContext({
    inventory: [{ inventoryId: "INV-1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda", currentQty: 20, retailValue: 55, vintage: 2025, storageLocationId: "H-1", collectionId: "COL-1" }],
    smokes: [{ smokeId: "S-1", inventoryId: "INV-1", dateSmoked: "2026-07-01", overall: 93, strength: "Medium", tastingNotes: "Cedar and coffee", buyAgain: true }],
    valuations: [{ valuationId: "V-1", inventoryId: "INV-1", valuationDate: "2026-07-10", marketValue: 62 }],
    wishlist: [{ wishlistId: "W-1", brand: "Trinidad", line: "Fundadores", vitola: "Laguito Especial", priority: "High", status: "Watching", createdAt: "2026-07-01" }],
    collections: [{ collectionId: "COL-1", name: "Habanos Selection", status: "Complete" }],
    humidors: [{ humidorId: "H-1", name: "Main Cabinet", targetTempF: 68, minTempF: 65, maxTempF: 72, targetHumidity: 67, minHumidity: 62, maxHumidity: 72 }],
    readings: [{ readingId: "R-1", humidorId: "H-1", recordedAt: "2026-07-20T12:00:00Z", temperatureF: 68, humidity: 67 }],
    selectedInventoryId: "INV-1",
  });
  assert.equal(context.privacy, "Private summary for this signed-in collector");
  assert.equal(context.inventory.documentedValue, 1100);
  assert.equal(context.selectedCigar?.latestValuePerCigar, 62);
  assert.equal(context.selectedCigar?.storage, "Main Cabinet");
  assert.equal(context.selectedCigar?.collection, "Habanos Selection");
  assert.deepEqual(context.wishlist.priorityTargets, ["Trinidad Fundadores Laguito Especial"]);
  assert.equal(context.taste.preferredStrength, "Medium");
});

test("collector context does not invent value or selected-cigar data", () => {
  const context = buildCigarSommCollectorContext({ inventory: [], smokes: [] });
  assert.equal(context.inventory.documentedValue, undefined);
  assert.equal(context.selectedCigar, undefined);
  assert.equal(context.taste.confidence, "Building");
});
