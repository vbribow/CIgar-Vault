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
