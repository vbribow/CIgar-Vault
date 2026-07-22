import assert from "node:assert/strict";
import test from "node:test";
import { standardVitolas, vitolaOptions } from "../lib/vitolas";

test("vitola selector covers standard parejos and figurados", () => {
  for (const value of ["Robusto", "Toro", "Churchill", "Lancero", "Piramide", "Perfecto", "Salomón", "Culebra", "Laguito No. 1"])
    assert.ok(standardVitolas.includes(value as typeof standardVitolas[number]));
});

test("catalog vitolas extend the standard dropdown without duplicates", () => {
  const options = vitolaOptions(["Robusto", "Rare Estate 1992", "Rare Estate 1992"]);
  assert.equal(options.filter((value) => value === "Robusto").length, 1);
  assert.equal(options.filter((value) => value === "Rare Estate 1992").length, 1);
});
