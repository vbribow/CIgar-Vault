import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fields = readFileSync(new URL("../components/catalog-fields.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("../lib/brand-directory.ts", import.meta.url), "utf8");

test("inventory entry offers an explicit manual manufacturer path", () => {
  assert.match(fields, /Manufacturer not listed\? Enter it manually/);
  assert.match(fields, /Brand \/ manufacturer \*/);
  assert.match(fields, /list=\{manualBrand\?undefined:"cigar-brand-options"\}/);
  assert.match(fields, /This name will be preserved on your private record/);
});

test("manual names remain unverified rather than being forced into a known manufacturer", () => {
  assert.match(fields, /will not treat it as verified catalog information until it is researched/);
  assert.match(directory, /return close\.length === 1 \? close\[0\]\.name : trimmed/);
});

test("switching modes clears dependent identity fields to prevent a mixed cigar identity", () => {
  assert.match(fields, /setManualBrand\(current=>!current\);setBrand\(""\);setLine\(""\);setVitola\(""\)/);
});
