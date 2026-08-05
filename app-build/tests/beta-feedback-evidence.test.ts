import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  accountDataRequestTemplate,
  BetaFeedbackInput,
  buildBetaEvidenceSummary,
  launchIncidentReportTemplate,
  type BetaEvidenceRecord,
} from "../lib/beta-feedback";

const session = (overrides: Partial<BetaEvidenceRecord> = {}): BetaEvidenceRecord => ({
  mode: "Session review",
  status: "Resolved",
  severity: "Low",
  task_outcome: "Completed independently",
  trust_score: 5,
  learning_depth_score: 4,
  recommendation_score: 9,
  ...overrides,
});

test("a short summary is enough to submit session feedback", () => {
  const result = BetaFeedbackInput.safeParse({
    mode: "Session review",
    category: "Other",
    severity: "Low",
    summary: "Completed inventory review",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.details, "");
});

test("the feedback form marks supporting evidence optional and reports submission progress", () => {
  const form = readFileSync(new URL("../components/beta-feedback-form.tsx", import.meta.url), "utf8");
  assert.match(form, /Only the short summary is required/);
  assert.match(form, /noValidate/);
  assert.match(form, /Sending your private feedback/);
  assert.match(form, /Every other response is optional/);
  assert.doesNotMatch(form, /name="(?:taskOutcome|experienceScore|trustScore|learningDepthScore|recommendationScore|languageContext|regionalPerspective|spellingFromAudio|nameAssociations|culturalFit|details)"[^>]*required/);
});

test("name and cultural feedback accepts useful optional context without exposing a candidate field", () => {
  const result = BetaFeedbackInput.safeParse({
    mode: "Name and culture",
    category: "Other",
    severity: "Low",
    summary: "Confidential name response",
    details: "The spoken and written forms felt credible in the context provided.",
    languageContext: "Spanish and English",
    regionalPerspective: "Dominican Republic and U.S. bilingual",
    spellingFromAudio: "Example spelling",
    nameAssociations: "Leaf, journey, and premium tobacco",
    culturalFit: "Credible",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal("candidate" in result.data, false);
});

test("account data requests become valid auditable feedback without deleting data", () => {
  for (const kind of ["access", "correction", "deletion"] as const) {
    const template = accountDataRequestTemplate(kind);
    assert.ok(template);
    assert.equal(template.category, "Trust or data");
    assert.equal(BetaFeedbackInput.safeParse(template).success, true);
  }
  assert.equal(accountDataRequestTemplate("unknown"), undefined);
  assert.match(accountDataRequestTemplate("deletion")?.details || "", /before removing/);
});

test("account and privacy surfaces expose the signed-in request path and safety boundary", () => {
  const account = readFileSync(new URL("../components/account-preferences-panel.tsx", import.meta.url), "utf8");
  const privacy = readFileSync(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  assert.match(account, /feedback\?request=access/);
  assert.match(account, /feedback\?request=correction/);
  assert.match(account, /feedback\?request=deletion/);
  assert.match(account, /does not immediately delete anything/);
  assert.match(privacy, /identity, scope, required retention, export options, timing, and irreversible effects/);
});

test("launch incidents become valid severity-mapped private reports without automatic action", () => {
  const expected = {
    "severity-1": "Blocking",
    "severity-2": "High",
    "severity-3": "Medium",
    "severity-4": "Low",
  } as const;
  for (const [severity, impact] of Object.entries(expected)) {
    const template = launchIncidentReportTemplate(severity);
    assert.ok(template);
    assert.equal(template.severity, impact);
    assert.equal(template.pageUrl, "/launch-readiness");
    assert.equal(BetaFeedbackInput.safeParse(template).success, true);
  }
  assert.equal(launchIncidentReportTemplate("severity-0"), undefined);
});

test("evidence summary passes only with complete cohort signals and no blocking issue", () => {
  const records: BetaEvidenceRecord[] = [
    session(),
    session(),
    session(),
    session(),
    { mode: "Name and culture", status: "Resolved", severity: "Low", cultural_fit: "Credible" },
    { mode: "Name and culture", status: "Resolved", severity: "Low", cultural_fit: "Mostly credible" },
  ];
  const summary = buildBetaEvidenceSummary(records);
  assert.equal(summary.ready, true);
  assert.equal(summary.readyCount, 6);

  const blocked = buildBetaEvidenceSummary([
    ...records,
    { mode: "Issue report", status: "Open", severity: "Blocking" },
  ]);
  assert.equal(blocked.ready, false);
  assert.equal(blocked.blocking, 1);
});

test("clearly marked founder acceptance records never count as beta evidence", () => {
  const testRecords: BetaEvidenceRecord[] = [
    session({
      summary: "[Founder test] Session-review acceptance",
      page_url: "/feedback — founder session acceptance",
    }),
    {
      mode: "Name and culture",
      status: "Closed",
      severity: "Low",
      summary: "[Founder test] Cultural-review acceptance",
      page_url: "/feedback — founder cultural acceptance",
      cultural_fit: "Credible",
    },
  ];

  const summary = buildBetaEvidenceSummary(testRecords);
  assert.equal(summary.totalReports, 0);
  assert.equal(summary.sessionReviews, 0);
  assert.equal(summary.culturalReviews, 0);
  assert.equal(summary.readyCount, 1);
});
