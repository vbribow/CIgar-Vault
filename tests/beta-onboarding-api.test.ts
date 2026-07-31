import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("founder onboarding enforces cohort capacity and duplicate-email feedback on the server", () => {
  const route = readFileSync(new URL("../app/api/founder-onboarding/route.ts", import.meta.url), "utf8");
  assert.match(route, /assertBetaSeatAvailable/);
  assert.match(route, /23505/);
  assert.match(route, /23514/);
  assert.match(route, /Founder authorization required/);
});

test("the database applies a transaction-safe 25-collector cohort limit", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202607290002_beta_cohort_capacity.sql", import.meta.url), "utf8");
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /occupied >= 25/);
  assert.match(migration, /before insert or update of stage/);
});

test("Hojavía sends reinstall notices only through the protected onboarding route", () => {
  const route = readFileSync(new URL("../app/api/founder-onboarding/reinstall-notice/route.ts", import.meta.url), "utf8");
  assert.match(route, /authorizeWrite/);
  assert.match(route, /beta_collectors/);
  assert.match(route, /sendAccountEmail/);
  assert.match(route, /accountEmailConfiguration/);
  assert.match(route, /Only an invited or active beta tester/);
  assert.match(route, /last_contact_at/);
});
