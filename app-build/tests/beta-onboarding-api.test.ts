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

test("founder can directly send a confirmed invitation while the server records access only after provider acceptance", () => {
  const route = readFileSync(new URL("../app/api/founder-onboarding/invite/route.ts", import.meta.url), "utf8");
  assert.match(route, /authorizeWrite/);
  assert.match(route, /submitAccountEmail/);
  assert.match(route, /assertBetaSeatAvailable/);
  assert.match(route, /stage: "Invited"/);
  assert.match(route, /RESEND_API_KEY/);
});

test("the database applies a transaction-safe 10-collector cohort limit", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202608080001_beta_cohort_capacity_10.sql", import.meta.url), "utf8");
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /occupied >= 10/);
  assert.match(migration, /10-collector founder cohort is full/);
});

test("Hojavía sends reinstall notices only through the protected onboarding route", () => {
  const route = readFileSync(new URL("../app/api/founder-onboarding/reinstall-notice/route.ts", import.meta.url), "utf8");
  assert.match(route, /authorizeWrite/);
  assert.match(route, /beta_collectors/);
  assert.match(route, /submitAccountEmail/);
  assert.match(route, /accountEmailConfiguration/);
  assert.match(route, /Only an invited or active beta tester/);
  assert.match(route, /last_contact_at/);
  assert.match(route, /acceptedAt/);
  assert.doesNotMatch(route, /sent: true/);
});

test("founder onboarding never describes provider acceptance as confirmed delivery", () => {
  const component = readFileSync(new URL("../components/founder-onboarding.tsx", import.meta.url), "utf8");
  assert.match(component, /delivery is not yet confirmed/);
  assert.doesNotMatch(component, /Hojavía sent the reinstall notice/);
});

test("founder onboarding offers one add-and-send invitation action with visible progress", () => {
  const component = readFileSync(new URL("../components/founder-onboarding.tsx", import.meta.url), "utf8");
  assert.match(component, /Add & send invitation/);
  assert.match(component, /Adding and sending…/);
  assert.match(component, /\/api\/founder-onboarding\/invite/);
  assert.doesNotMatch(component, /Add to queue/);
});

test("founder can update a collector stage while readiness evidence remains advisory", () => {
  const component = readFileSync(new URL("../components/founder-onboarding.tsx", import.meta.url), "utf8");
  assert.match(component, /method:\s*"PATCH"/);
  assert.match(component, /Saving stage…/);
  assert.doesNotMatch(component, /stage==="Invited"&&!readiness\?\.ready/);
});

test("founder dashboard exposes private milestone signals without cigar details", () => {
  const route = readFileSync(new URL("../app/api/founder-onboarding/route.ts", import.meta.url), "utf8");
  const component = readFileSync(new URL("../components/founder-onboarding.tsx", import.meta.url), "utf8");
  assert.match(route, /accountCreated/);
  assert.match(route, /consentRecorded/);
  assert.match(route, /inventoryLots/);
  assert.match(route, /backupRecorded/);
  assert.match(route, /smokeLogged/);
  assert.match(route, /insuranceViewed/);
  assert.match(component, /betaProgressSteps/);
  assert.match(component, /Progress refreshed automatically/);
  assert.match(component, /Product milestone/);
  assert.doesNotMatch(component, />Activated</);
});
