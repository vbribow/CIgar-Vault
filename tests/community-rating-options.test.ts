import assert from "node:assert/strict";
import test from "node:test";
import { communityRatingInventoryOptions } from "../lib/community-rating-options";
import type { InventoryItem } from "../lib/types";

const item = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  inventoryId: "INV-1",
  brand: "Arturo Fuente",
  line: "Casa Fuente",
  vitola: "Double Corona",
  currentQty: 2,
  ...overrides,
});

test("community rating choices include only cigars currently in the collector's Vault", () => {
  const options = communityRatingInventoryOptions([
    item(),
    item({ inventoryId: "INV-2", line: "OpusX", vitola: "Petite Lancero", currentQty: 0 }),
  ]);
  assert.deepEqual(options, [{ inventoryId: "INV-1", brand: "Arturo Fuente", line: "Casa Fuente", vitola: "Double Corona", vintage: undefined }]);
});

test("community rating choices remove duplicate cigar identities and retain release year", () => {
  const options = communityRatingInventoryOptions([
    item({ inventoryId: "INV-1", vintage: 2025 }),
    item({ inventoryId: "INV-2", vintage: "2025", currentQty: 3 }),
  ]);
  assert.equal(options.length, 1);
  assert.equal(options[0].vintage, "2025");
});
