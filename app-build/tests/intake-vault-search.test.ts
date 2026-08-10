import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");

test("typed intake checks the private Vault before optional research", () => {
  assert.match(intake, />Check my Vault</);
  assert.match(intake, /This check uses no research credits/);
  assert.match(intake, /possible existing Vault record/);
  assert.match(intake, />Open record</);
  assert.match(intake, />Edit all details</);
  assert.match(intake, /This is a separate lot — research it/);
});

test("typed intake supports keyboard search and never saves during the check", () => {
  assert.match(intake, /event\.key === "Enter"/);
  assert.match(intake, /onClick=\{checkVault\}/);
  assert.match(intake, /Nothing is saved until you review and confirm it/);
});
