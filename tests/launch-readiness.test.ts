import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { launchBaseline, launchGates, launchReadinessSummary } from "../lib/launch-readiness";

test("launch baseline records the verified build and full-suite result", () => {
  assert.equal(launchBaseline.build, "Passed");
  assert.equal(launchBaseline.typecheck, "Passed");
  assert.deepEqual(launchBaseline.automatedTests, { passed: 730, failed: 0 });
  assert.equal(launchReadinessSummary().blockingDefects, 0);
  assert.equal(launchReadinessSummary().blockingGates, 10);
  assert.equal(launchReadinessSummary().decision, "HOLD");
  assert.equal(launchGates.find(gate => gate.id === "brand-clearance-adoption")?.status, "In progress");
  assert.equal(launchGates.find(gate => gate.id === "automation-privacy")?.status, "Passed");
  assert.equal(launchGates.find(gate => gate.id === "valuation-coverage")?.status, "Passed");
});

test("a clean automated baseline never claims real-device gates are complete", () => {
  for (const id of ["cross-device-sync", "photo-completion", "import-recovery", "founder-beta"]) {
    assert.equal(launchGates.find(gate => gate.id === id)?.status, "In progress");
  }
});

test("local artifact rollback evidence never claims production-provider rollback passed", () => {
  const gate = launchGates.find(item => item.id === "stability-device-acceptance");
  assert.ok(gate);
  assert.match(gate.evidence, /guarded local rehearsal verified 215 release files/i);
  assert.match(gate.evidence, /without changing production or user data/i);
  assert.match(gate.evidence, /production-provider and database recovery/i);
  assert.match(gate.evidence, /migration-history reconciliation/i);
  assert.equal(gate.status, "In progress");
});

test("brand clearance remains a controlling launch gate", () => {
  const gate = launchGates.find(item => item.id === "brand-clearance-adoption");
  assert.ok(gate);
  assert.match(gate.evidence, /HOVIA/);
  assert.match(gate.evidence, /No public launch/);
  assert.equal(launchReadinessSummary().decision, "HOLD");
});

test("every hard operational launch domain is represented before READY", () => {
  for (const id of [
    "auth-isolation-recovery",
    "legal-privacy-support",
    "billing-entitlements",
    "stability-device-acceptance",
  ]) {
    assert.ok(launchGates.some(gate => gate.id === id), `${id} must remain visible`);
  }
  assert.equal(launchGates.find(gate => gate.id === "billing-entitlements")?.status, "In progress");
  assert.equal(launchGates.find(gate => gate.id === "stability-device-acceptance")?.status, "In progress");
  assert.equal(launchReadinessSummary().decision, "HOLD");
});

test("affiliate agreements and unresolved legal ownership remain deferred", () => {
  assert.equal(launchGates.find(gate => gate.id === "affiliate-programs")?.status, "Deferred");
  assert.equal(launchGates.find(gate => gate.id === "legal-owner")?.status, "Deferred");
});

test("the launch workspace exposes the three remaining founder acceptance sessions without claiming they passed",()=>{
  const page=readFileSync(new URL("../app/launch-readiness/page.tsx",import.meta.url),"utf8");
  assert.match(page,/Three live product sessions remain/);
  assert.match(page,/launch decision/);
  assert.match(page,/summary\.blockingGates/);
  assert.match(page,/confidential, reversible presentation/);
  assert.match(page,/href="\/inventory#inventory-records"/);
  assert.match(page,/href="\/inventory#mobile-intake"/);
  assert.match(page,/href="\/account"/);
  assert.match(page,/A1 and A2 passed/);
  assert.match(page,/Synthetic CSV and XLSX classification passed/);
  assert.match(page,/href="\/founder-onboarding"/);
  assert.match(page,/Enter the Founder key only in the protected screen/);
  assert.match(page,/PASS, FAIL, or NOT RUN/);
  assert.match(page,/Classify, contain, recover, then reopen/);
  assert.match(page,/Seven-day stability/);
  assert.match(page,/verified days/);
  assert.match(page,/stability clock has not started/);
  assert.match(page,/feedback\?incident=severity-/);
});
