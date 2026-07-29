import assert from "node:assert/strict";
import test from "node:test";
import { BetaFeedbackInput, buildBetaEvidenceSummary, type BetaEvidenceRecord } from "../lib/beta-feedback";

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

test("session reviews require outcome and launch-quality scores", () => {
  const result = BetaFeedbackInput.safeParse({
    mode: "Session review",
    category: "Other",
    severity: "Low",
    summary: "Completed inventory review",
    details: "The workflow was clear and the saved quantities remained accurate.",
  });
  assert.equal(result.success, false);
});

test("name and cultural feedback requires regional evidence without exposing a candidate field", () => {
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
