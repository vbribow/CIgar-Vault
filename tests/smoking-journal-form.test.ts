import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/records-manager.tsx", import.meta.url), "utf8");

test("smoking journal offers a complete score scale and common strength choices", () => {
  assert.match(source, /Array\.from\(\{ length: 101 \}/);
  for (const strength of ["Mild", "Mild–medium", "Medium", "Medium–full", "Full"]) assert.match(source, new RegExp(`"${strength}"`));
});

test("smoking journal supports manual cigars without consuming inventory", () => {
  assert.match(source, /value="MANUAL">Another cigar — enter manually/);
  assert.match(source, /name="cigarName"/);
  assert.match(source, /without reducing inventory/);
});

test("smoking journal records up to three structured flavor notes", () => {
  assert.match(source, /Flavor notes · choose up to 3/);
  assert.match(source, /\[1, 2, 3\]\.map/);
  assert.match(source, /flavors\.join\(", "\)/);
});
