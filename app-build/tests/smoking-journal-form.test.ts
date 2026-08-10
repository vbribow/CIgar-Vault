import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/records-manager.tsx", import.meta.url), "utf8");

test("smoking journal offers a complete score scale and common strength choices", () => {
  assert.match(source, /Array\.from\(\{ length: 101 \}/);
  for (const strength of ["Mild", "Mild–medium", "Medium", "Medium–full", "Full"]) assert.match(source, new RegExp(`"${strength}"`));
});

test("smoking journal supports manual cigars without consuming inventory", () => {
  assert.match(source, /setSmokeSource\("MANUAL"\)/);
  assert.match(source, /Do not remove from my Vault/);
  assert.match(source, /name="cigarName"/);
  assert.match(source, /no Vault record and no quantity change/);
});

test("mobile smoke saves explain missing required fields instead of appearing unresponsive", () => {
  assert.match(source, /className="recordForm" noValidate onSubmit=/);
  assert.match(source, /!formElement\.checkValidity\(\)/);
  assert.match(source, /querySelector<[^>]+>\(":invalid"\)/);
  assert.match(source, /smokeRequiredFieldMessage\(invalid\?\.name/);
  assert.match(source, /Choose ‘Remove from my Vault’ and select the exact lot/);
  assert.match(source, /invalid\?\.scrollIntoView/);
});

test("smoking journal clearly separates review-only, owned-lot, and add-to-Vault paths", () => {
  assert.match(source, /Do not remove from my Vault/);
  assert.match(source, /Remove from my Vault/);
  assert.match(source, /Add to Vault first/);
  assert.match(source, /href="\/inventory#mobile-intake"/);
  assert.match(source, /Vault quantities stay unchanged/);
});

test("review-only smokes can be identified by photo and require collector confirmation", () => {
  assert.match(source, /accept="image\/\*" capture="environment"/);
  assert.match(source, /\/api\/photo-identification/);
  assert.match(source, /Identify cigar/);
  assert.match(source, /review required/);
  assert.match(source, /value=\{smokeCigarName\}/);
  assert.match(source, /Confirm or correct the cigar before saving your review/);
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
