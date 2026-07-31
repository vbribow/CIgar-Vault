import assert from "node:assert/strict";
import test from "node:test";
import { assessStabilityWindow, type StabilityObservation } from "../lib/stability-window";

const candidate = "a".repeat(64);
const good = (date: string, overrides: Partial<StabilityObservation> = {}): StabilityObservation => ({
  date,
  candidateFingerprint: candidate,
  productionLike: true,
  buildPassed: true,
  criticalJourneysPassed: true,
  automationHealthy: true,
  recordsReconciled: true,
  severityOneOpen: 0,
  criticalPathSeverityTwoOpen: 0,
  evidenceRef: `evidence/${date}`,
  ...overrides,
});

test("stability cannot begin before the release candidate is frozen", () => {
  const result = assessStabilityWindow({ observations: [], asOf: "2026-07-31" });
  assert.equal(result.daysCompleted, 0);
  assert.equal(result.ready, false);
  assert.match(result.reasons.join(" "), /fingerprint/);
});

test("seven consecutive evidenced production-like days pass", () => {
  const observations = [25, 26, 27, 28, 29, 30, 31].map(day => good(`2026-07-${day}`));
  const result = assessStabilityWindow({ currentCandidate: candidate, observations, asOf: "2026-07-31" });
  assert.equal(result.daysCompleted, 7);
  assert.equal(result.ready, true);
  assert.equal(result.windowStart, "2026-07-25");
  assert.equal(result.windowEnd, "2026-07-31");
});

test("a critical-path incident resets the consecutive window", () => {
  const observations = [
    good("2026-07-25"), good("2026-07-26"),
    good("2026-07-27", { criticalPathSeverityTwoOpen: 1 }),
    good("2026-07-28"), good("2026-07-29"), good("2026-07-30"), good("2026-07-31"),
  ];
  const result = assessStabilityWindow({ currentCandidate: candidate, observations, asOf: "2026-07-31" });
  assert.equal(result.daysCompleted, 4);
  assert.equal(result.ready, false);
  assert.match(result.reasons.join(" "), /blocking incident/);
});

test("a missing or duplicate day fails closed", () => {
  const missing = assessStabilityWindow({ currentCandidate: candidate, observations: [good("2026-07-29"), good("2026-07-31")], asOf: "2026-07-31" });
  assert.equal(missing.daysCompleted, 1);
  assert.match(missing.reasons.join(" "), /missing/);
  const duplicate = assessStabilityWindow({ currentCandidate: candidate, observations: [good("2026-07-30"), good("2026-07-30"), good("2026-07-31")], asOf: "2026-07-31" });
  assert.equal(duplicate.daysCompleted, 1);
  assert.match(duplicate.reasons.join(" "), /Duplicate/);
});

test("evidence from another candidate never advances the current window", () => {
  const observations = [good("2026-07-30", { candidateFingerprint: "b".repeat(64) }), good("2026-07-31", { candidateFingerprint: "b".repeat(64) })];
  const result = assessStabilityWindow({ currentCandidate: candidate, observations, asOf: "2026-07-31" });
  assert.equal(result.daysCompleted, 0);
  assert.match(result.reasons.join(" "), /No qualifying/);
});
