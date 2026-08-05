import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/records-manager.tsx", import.meta.url), "utf8");

test("smoking journal offers a complete score scale and common strength choices", () => {
  assert.match(source, /Array\.from\(\{ length: 101 \}/);
  for (const strength of ["Mild", "Mild–medium", "Medium", "Medium–full", "Full"]) assert.match(source, new RegExp(`"${strength}"`));
});

test("smoking journal supports manual cigars without consuming inventory", () => {
  assert.match(source, /value="MANUAL">Another smoke — not in my Vault/);
  assert.match(source, /name="cigarName"/);
  assert.match(source, /without changing inventory/);
});

test("smoking journal records up to three structured flavor notes", () => {
  assert.match(source, /Flavor notes · choose up to 3/);
  assert.match(source, /\[1, 2, 3\]\.map/);
  assert.match(source, /flavors\.join\(", "\)/);
});

test("smoking journal keeps construction and burn optional, structured, and distinct", () => {
  assert.match(source, /Construction Quality/);
  assert.match(source, /name="construction"/);
  assert.match(source, /How well the cigar was physically made—not its flavor or strength/);
  assert.match(source, /name="burn"/);
  assert.match(source, /How evenly the cigar burned and whether it needed correction/);
  for (const option of ["Excellent", "Very good", "Good", "Fair", "Poor", "Even throughout", "Minor touch-up", "Multiple touch-ups", "Relight required", "Major burn issue"]) {
    assert.match(readFileSync(new URL("../lib/records-model.ts", import.meta.url), "utf8"), new RegExp(`"${option}"`));
  }
});
