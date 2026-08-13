import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeAuthNext } from "../lib/auth-navigation";
import { normalizeBetaEmail } from "../lib/beta-access";

test("invited-email matching is normalized without broad wildcard matching", () => {
  assert.equal(normalizeBetaEmail("  Collector@Example.COM "), "collector@example.com");
  const access = readFileSync(new URL("../lib/beta-access.ts", import.meta.url), "utf8");
  assert.match(access, /\.eq\("email", normalizeBetaEmail\(email\)\)/);
  assert.doesNotMatch(access, /\.ilike\(/);
});

test("the controlled onboarding queue claims a cohort seat without a manual stage change", () => {
  const access = readFileSync(new URL("../lib/beta-access.ts", import.meta.url), "utf8");
  assert.match(access, /if \(!data\)/);
  assert.doesNotMatch(access, /data\.stage === "Prospect"/);
  assert.match(access, /if\(data\.stage==="Prospect"\)/);
  assert.match(access, /update\(\{stage:"Invited"/);
  assert.match(access, /advanceBetaCollectorStage/);
});

test("account and inventory milestones advance the beta pipeline automatically", () => {
  const actions = readFileSync(new URL("../app/login/actions.ts", import.meta.url), "utf8");
  const records = readFileSync(new URL("../lib/user-data.ts", import.meta.url), "utf8");
  assert.match(actions, /advanceBetaCollectorStage\(email,"Signed up"\)/);
  assert.match(records, /advanceInventoryProgress/);
  assert.match(records, /advanceBetaCollectorStage\(context\.user\.email,"Imported"\)/);
  assert.match(records, /records\.some\(record=>record\.kind==="inventory"\)/);
  assert.match(records, /must never turn a successful collector-data save into a failure/);
});

test("authentication redirects accept only same-origin paths", () => {
  assert.equal(safeAuthNext("/inventory?tab=owned#top"), "/inventory?tab=owned#top");
  assert.equal(safeAuthNext("https://attacker.example"), "/");
  assert.equal(safeAuthNext("//attacker.example"), "/");
  assert.equal(safeAuthNext("/\\attacker.example"), "/");
  assert.equal(safeAuthNext(null), "/");
});

test("new signup metadata uses Hojavía consent while the trigger retains legacy compatibility", () => {
  const actions = readFileSync(new URL("../app/login/actions.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/202607290003_hojavia_signup_consent.sql", import.meta.url), "utf8");
  const legacyConsentKey = `${["ced", "riva"].join("")}_consent_version`;
  assert.match(actions, /hojavia_consent_version/);
  assert.equal(actions.includes(legacyConsentKey), false);
  assert.match(migration, /hojavia_consent_version/);
  assert.equal(migration.includes(legacyConsentKey), true);
  assert.match(migration, /revoke execute .* from anon/);
  assert.match(migration, /revoke execute .* from authenticated/);
});
