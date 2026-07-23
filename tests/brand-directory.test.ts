import assert from "node:assert/strict";
import test from "node:test";
import { canonicalBrand, cigarBrands } from "../lib/brand-directory";

test("brand directory includes all 27 official Habanos brands", () => {
  assert.equal(cigarBrands.filter((brand) => brand.region === "Cuba").length, 27);
});

test("common spelling variants normalize to a canonical brand", () => {
  assert.equal(canonicalBrand("Ramon Allones"), "Ramón Allones");
  assert.equal(canonicalBrand("Bolivar"), "Bolívar");
});

test("brand directory includes a broad boutique segment", () => {
  const boutiques = cigarBrands.filter((brand) => brand.segment === "Boutique");
  assert.ok(boutiques.length >= 50);
  for (const name of ["Foundation", "Dunbarton Tobacco & Trust", "Warped", "Crowned Heads", "Apostate", "Domain"]) {
    assert.ok(boutiques.some((brand) => brand.name === name), `${name} should be listed as boutique`);
  }
});
