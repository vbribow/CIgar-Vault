import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { founderGoNoGoChecklist, launchBaseline, launchDeviceMatrix, launchGates, launchReadinessSummary, webLaunchCriticalJourneys } from "../lib/launch-readiness";

test("launch baseline records the verified build and full-suite result", () => {
  assert.equal(launchBaseline.build, "Passed");
  assert.equal(launchBaseline.typecheck, "Passed");
  assert.deepEqual(launchBaseline.automatedTests, { passed: 1168, failed: 0 });
  assert.equal(launchReadinessSummary().blockingDefects, 0);
  assert.equal(launchReadinessSummary().blockingGates, 12);
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
  assert.match(gate.evidence, /1,168 tests/i);
  assert.match(gate.evidence, /without production or collector-data changes/i);
  assert.match(gate.evidence, /candidate remains unfrozen/i);
  assert.match(gate.evidence, /sensor-continuity/i);
  assert.equal(gate.status, "In progress");
});

test("trademark and public-release work remains a controlling launch gate", () => {
  const gate = launchGates.find(item => item.id === "brand-clearance-adoption");
  assert.ok(gate);
  assert.match(gate.evidence, /Emberward Holdings LLC/);
  assert.match(gate.evidence, /intent-to-use application/);
  assert.equal(launchReadinessSummary().decision, "HOLD");
});

test("sensor continuity and Places scope remain explicit launch gates",()=>{
  assert.equal(launchGates.find(gate=>gate.id==="sensor-continuity")?.status,"In progress");
  assert.equal(launchGates.find(gate=>gate.id==="places-scope-acceptance")?.status,"In progress");
});

test("every hard operational launch domain is represented before READY", () => {
  for (const id of [
    "auth-isolation-recovery",
    "legal-privacy-support",
    "billing-entitlements",
    "openai-research-activation",
    "stability-device-acceptance",
  ]) {
    assert.ok(launchGates.some(gate => gate.id === id), `${id} must remain visible`);
  }
  assert.equal(launchGates.find(gate => gate.id === "billing-entitlements")?.status, "In progress");
  assert.equal(launchGates.find(gate => gate.id === "openai-research-activation")?.status, "Not started");
  assert.equal(launchGates.find(gate => gate.id === "stability-device-acceptance")?.status, "In progress");
  assert.equal(launchReadinessSummary().decision, "HOLD");
});

test("known legal ownership is recorded without passing trademark or affiliate work", () => {
  assert.equal(launchGates.find(gate => gate.id === "affiliate-programs")?.status, "Deferred");
  assert.equal(launchGates.find(gate => gate.id === "legal-owner")?.status, "Passed");
  assert.equal(launchGates.find(gate => gate.id === "brand-clearance-adoption")?.status, "In progress");
});

test("the launch workspace exposes the three remaining founder acceptance sessions without claiming they passed",()=>{
  const page=readFileSync(new URL("../app/launch-readiness/page.tsx",import.meta.url),"utf8");
  assert.match(page,/Three live product sessions remain/);
  assert.match(page,/launch decision/);
  assert.match(page,/summary\.blockingGates/);
  assert.match(page,/shortest credible web launch/i);
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
  assert.match(page,/Close evidence, not checkboxes/);
  assert.match(page,/launchDeviceMatrix/);
  assert.match(page,/founderGoNoGoChecklist/);
});

test("device and founder gates remain explicit instead of being inferred", () => {
  assert.deepEqual(launchDeviceMatrix.map(item => item.status), ["Partial", "Not run"]);
  assert.ok(founderGoNoGoChecklist.some(item => item.gate === "Database migrations" && item.status === "Hold"));
  assert.ok(founderGoNoGoChecklist.some(item => item.gate === "Sensors" && item.status === "Current — stability open"));
  assert.ok(founderGoNoGoChecklist.some(item => item.gate === "Live cigar research" && item.status === "Hold — billing required"));
  assert.equal(founderGoNoGoChecklist.some(item => String(item.status) === "Passed"), false);
});

test("every launch gate identifies dated evidence, accountability, and an exact next action",()=>{
  for(const gate of launchGates){
    assert.ok(gate.owner.trim(),`${gate.id} needs an owner`);
    assert.match(gate.evidenceDate,/^2026-\d{2}-\d{2}$/);
    assert.ok(gate.nextAction.trim(),`${gate.id} needs a next action`);
  }
});

test("the web launch pass keeps every essential collector journey visible",()=>{
  assert.deepEqual(webLaunchCriticalJourneys.map(item=>item.id),["account","vault","smoke","rankings","sensors","places"]);
  assert.ok(webLaunchCriticalJourneys.every(item=>item.automated==="Passed"));
  assert.ok(webLaunchCriticalJourneys.some(item=>item.live==="Required"));
  const page=readFileSync(new URL("../app/launch-readiness/page.tsx",import.meta.url),"utf8");
  assert.match(page,/Six journeys control the release/);
  assert.match(page,/Native app-store work is intentionally deferred/);
  assert.match(page,/no unresolved duplicate or data-loss concern/i);
});

test("live collection evidence records the protected two-lot reconciliation", () => {
  const gate = launchGates.find(item => item.id === "collection-truth");
  assert.ok(gate);
  assert.match(gate.evidence, /INV-0014 remains 15\/15/);
  assert.match(gate.evidence, /INV-0015 remains 15\/15/);
  assert.match(gate.evidence, /without merging or deleting either lot/);
  assert.equal(gate.status, "Passed");
});
