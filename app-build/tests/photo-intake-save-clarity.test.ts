import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");

test("photo intake separates review from the actual private Vault save", () => {
  assert.match(intake, />Continue to final review</);
  assert.match(intake, /Nothing is saved to your Vault until you confirm it/);
  assert.match(intake, /Add \$\{pending\} selected lot/);
  assert.match(intake, /Adding to Vault…/);
});

test("mobile intake reveals completion and validation feedback", () => {
  assert.match(intake, /completion\.current\?\.scrollIntoView/);
  assert.match(intake, /messageOutput\.current\?\.scrollIntoView/);
  assert.match(intake, /tabIndex=\{-1\}/);
});
