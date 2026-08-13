import assert from "node:assert/strict";
import test from "node:test";
import { brandIdentityEvidence, canonicalBrand, cigarBrands } from "../lib/brand-directory";

test("brand directory includes all 27 official Habanos brands", () => {
  assert.equal(cigarBrands.filter((brand) => brand.region === "Cuba").length, 27);
});

test("common spelling variants normalize to a canonical brand", () => {
  assert.equal(canonicalBrand("Ramon Allones"), "Ramón Allones");
  assert.equal(canonicalBrand("Bolivar"), "Bolívar");
  assert.equal(canonicalBrand("Drew state"), "Drew Estate");
  assert.equal(canonicalBrand("HDA"), "Hermanos de Armas (HDA Cigars)");
  assert.equal(canonicalBrand("HDA Cigars"), "Hermanos de Armas (HDA Cigars)");
  assert.equal(canonicalBrand("ATL"), "ATL Cigar Co.");
  assert.equal(canonicalBrand("Hiram and Solomon"), "Hiram & Solomon");
  assert.equal(canonicalBrand("Rojas Cigars"), "Rojas");
});

test("brand directory includes a broad boutique segment", () => {
  const boutiques = cigarBrands.filter((brand) => brand.segment === "Boutique");
  assert.ok(boutiques.length >= 50);
  for (const name of ["Foundation", "Dunbarton Tobacco & Trust", "Warped", "Crowned Heads", "Apostate", "Domain", "Hermanos de Armas (HDA Cigars)"]) {
    assert.ok(boutiques.some((brand) => brand.name === name), `${name} should be listed as boutique`);
  }
});

test("priority boutique identities enter at identity-only depth", () => {
  assert.equal(cigarBrands.length, 194);
  for (const name of ["Artesano del Tobacco", "Blackbird Cigar Co.", "Casa 1910", "Micallef Cigars", "Selected Tobacco", "Wildfire Cigar Co."]) {
    const brand = cigarBrands.find((candidate) => candidate.name === name);
    assert.equal(brand?.segment, "Boutique");
    assert.equal(brand?.region, "Other");
    assert.equal(brand?.evidence?.depth, "Identity only");
    assert.match(brand?.evidence?.sourceUrl || "", /^https:\/\//);
    assert.match(brand?.evidence?.checkedAt || "", /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(brandIdentityEvidence("ATL")?.depth, "Identity only");
  assert.equal(brandIdentityEvidence("Padrón"), undefined);
});
