import test from "node:test";
import assert from "node:assert/strict";
import { discoveryMatches } from "../lib/discovery-guide";
import type { CatalogCigar } from "../lib/types";

const catalog: CatalogCigar[] = [
  { catalogId: "MILD", brand: "Gentle House", line: "Welcome", vitola: "Robusto", country: "Dominican Republic", strength: "Mild", sourceUrl: "https://example.com/mild" },
  { catalogId: "CRAFT", brand: "Craft House", line: "Workshop", vitola: "Toro", country: "Nicaragua", strength: "Full", factory: "Fábrica Uno", blender: "Ana Blender", wrapper: "Habano" },
  { catalogId: "RARE", brand: "Legacy House", line: "Anniversary", vitola: "Corona", country: "Honduras", strength: "Medium", releaseYear: 2024, edition: "Limited Edition", discontinued: true },
];

test("guided discovery changes recommendations according to collector intent", () => {
  assert.equal(discoveryMatches(catalog, [], { goal: "Begin comfortably", strength: "Any strength", origin: "Any origin" })[0].cigar.catalogId, "MILD");
  assert.equal(discoveryMatches(catalog, [], { goal: "Study origin and craft", strength: "Any strength", origin: "Any origin" })[0].cigar.catalogId, "CRAFT");
  assert.equal(discoveryMatches(catalog, [], { goal: "Find a collectible", strength: "Any strength", origin: "Any origin" })[0].cigar.catalogId, "RARE");
});

test("guided discovery honors explicit origin and strength preferences", () => {
  const [match] = discoveryMatches(catalog, [], { goal: "Expand my palate", strength: "Full", origin: "Nicaragua" });
  assert.equal(match.cigar.catalogId, "CRAFT");
  assert.ok(match.reasons.some((reason) => reason.includes("Nicaragua")));
});
