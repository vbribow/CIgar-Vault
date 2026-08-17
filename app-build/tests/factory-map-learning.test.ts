import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { factoryMapCountries, factoryRelationshipModels } from "../lib/factory-map-study";

const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/learn/factory-map-reading/page.tsx"), "utf8");
const learn = fs.readFileSync(path.resolve(import.meta.dirname, "../app/learn/page.tsx"), "utf8");

test("factory-map lesson preserves the full country and factory transcription", () => {
  assert.equal(factoryMapCountries.length, 5);
  assert.equal(factoryMapCountries.reduce((total, country) => total + country.factories.length, 0), 54);
  assert.equal(new Set(factoryMapCountries.flatMap((country) => country.factories)).size, 54);
});

test("factory-map lesson explains relationship models without treating the source as verification", () => {
  assert.equal(factoryRelationshipModels.length, 3);
  assert.match(page, /map is undated and its relationships can change/);
  assert.match(page, /does not independently verify a factory for a specific cigar/);
  assert.match(page, /exact identity and time period/);
});

test("factory-map lesson is reachable from education and verified manufacturing truth", () => {
  assert.match(learn, /href="\/learn\/factory-map-reading"/);
  assert.match(page, /href="\/learn\/manufacturing-truth"/);
  assert.match(page, /href="\/catalog-discovery#research-backlog"/);
});
