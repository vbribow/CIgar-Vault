import test from "node:test";
import assert from "node:assert/strict";
import { discoverViewData } from "../lib/discover-view-data";

test("Discover stays available when optional providers return malformed containers", () => {
  assert.deepEqual(discoverViewData(null, undefined), { candidates: [], ownedBrands: [] });
  assert.deepEqual(discoverViewData({ error: "offline" }, "unavailable"), { candidates: [], ownedBrands: [] });
});

test("Discover skips malformed rows without hiding valid candidates", () => {
  const result = discoverViewData(
    [{ inventoryId: "INV-1", brand: "Padron", line: "1964", vitola: "Diplomatico" }, { brand: null }],
    [
      { catalogId: "CAT-OWNED", brand: "Padron", line: "1964", vitola: "Diplomatico" },
      { catalogId: "CAT-NEW", brand: "Arturo Fuente", line: "Don Carlos", vitola: "Robusto", sourceUrl: "https://example.com/don-carlos" },
      { catalogId: "CAT-BROKEN", brand: "", line: "Unknown", vitola: null },
    ],
  );

  assert.deepEqual(result.ownedBrands, ["padron"]);
  assert.deepEqual(result.candidates.map(item => item.catalogId), ["CAT-NEW"]);
});

test("Discover de-duplicates exact products even when a catalog id is unavailable", () => {
  const result = discoverViewData([], [
    { catalogId: "", brand: "My Father", line: "Le Bijou 1922", vitola: "Toro" },
    { brand: "My Father", line: "Le Bijou 1922", vitola: "Toro" },
  ]);

  assert.equal(result.candidates.length, 1);
});
