import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  immediateIncidentActions,
  incidentClosureDecision,
  incidentSeverityStandard,
} from "../lib/incident-response";

test("incident severity keeps trust failures and critical-path failures distinct", () => {
  assert.equal(incidentSeverityStandard.length, 4);
  assert.match(incidentSeverityStandard[0].definition, /cross-user exposure/);
  assert.match(incidentSeverityStandard[0].launchEffect, /Hold invitations/);
  assert.match(incidentSeverityStandard[1].definition, /critical journey completes incorrectly/);
  assert.match(incidentSeverityStandard[2].definition, /misleading presentation/);
  assert.match(incidentSeverityStandard[3].definition, /Cosmetic or low-impact/);
});

test("incident closure fails closed until every recovery and reopening proof exists", () => {
  const incomplete = incidentClosureDecision({
    contained: true,
    rootCauseRecorded: true,
    correctionVerified: true,
    regressionCoverage: true,
    recoveryVerified: false,
    affectedRecordsReconciled: true,
    feedbackResolved: true,
    launchGateReassessed: true,
    ownerApprovedReopen: false,
  });
  assert.equal(incomplete.readyToReopen, false);
  assert.deepEqual(incomplete.missing, [
    "Recovery is verified without assuming success",
    "The accountable owner explicitly approves reopening",
  ]);

  const complete = incidentClosureDecision({
    contained: true,
    rootCauseRecorded: true,
    correctionVerified: true,
    regressionCoverage: true,
    recoveryVerified: true,
    affectedRecordsReconciled: true,
    feedbackResolved: true,
    launchGateReassessed: true,
    ownerApprovedReopen: true,
  });
  assert.equal(complete.readyToReopen, true);
  assert.deepEqual(complete.missing, []);
});

test("launch control exposes private severity intake and explicit reopen evidence", () => {
  const page = readFileSync(new URL("../app/launch-readiness/page.tsx", import.meta.url), "utf8");
  assert.equal(immediateIncidentActions.length, 6);
  assert.match(page, /Incident command/);
  assert.match(page, /feedback\?incident=severity-/);
  assert.match(page, /Opening an incident form changes nothing and sends nothing/i);
  assert.match(page, /accountable-owner approval/);
});
