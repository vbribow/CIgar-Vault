import assert from "node:assert/strict";
import test from "node:test";
import { isPhysicalVitola,standardVitolas, vitolaOptions } from "../lib/vitolas";

test("vitola selector covers standard parejos and figurados", () => {
  for (const value of ["Robusto", "Toro", "Churchill", "Lancero", "Piramide", "Perfecto", "Salomón", "Culebra", "Laguito No. 1"])
    assert.ok(standardVitolas.includes(value as typeof standardVitolas[number]));
});

test("catalog vitolas extend the standard dropdown without duplicates", () => {
  const options = vitolaOptions(["Robusto", "Rare Estate 1992", "Rare Estate 1992"]);
  assert.equal(options.filter((value) => value === "Robusto").length, 1);
  assert.equal(options.filter((value) => value === "Rare Estate 1992").length, 1);
});

test("a cigar-specific dropdown never invents unavailable vitolas", () => {
  const options = vitolaOptions(["Robusto", "Toro","Rare Estate 1992","BBMF Natural","Toro — 6 × 52"], false);
  assert.deepEqual(options, ["Robusto", "Toro", "Toro — 6 × 52"]);
  assert.equal(options.includes("Double Corona"), false);
});

test("physical vitola validation rejects cigar and release names",()=>{
  assert.equal(isPhysicalVitola("Robusto"),true);
  assert.equal(isPhysicalVitola("Toro — 6 × 52"),true);
  assert.equal(isPhysicalVitola("Rare Estate Reserve 1992"),false);
  assert.equal(isPhysicalVitola("BBMF Natural"),false);
});
