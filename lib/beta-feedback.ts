import { z } from "zod";

export const BetaFeedbackMode = z.enum(["Issue report", "Session review", "Name and culture"]);
export type BetaFeedbackMode = z.infer<typeof BetaFeedbackMode>;

export const AccountDataRequestKind = z.enum(["access", "correction", "deletion"]);
export type AccountDataRequestKind = z.infer<typeof AccountDataRequestKind>;

export const LaunchIncidentSeverity = z.enum(["severity-1", "severity-2", "severity-3", "severity-4"]);
export type LaunchIncidentSeverity = z.infer<typeof LaunchIncidentSeverity>;

export const BetaFeedbackInput = z.object({
  mode: BetaFeedbackMode.default("Issue report"),
  category: z.enum(["Bug", "Confusing", "Suggestion", "Trust or data", "Other"]),
  severity: z.enum(["Low", "Medium", "High", "Blocking"]),
  pageUrl: z.string().trim().max(500).optional(),
  summary: z.string().trim().min(5).max(160),
  details: z.string().trim().max(4000).optional().default(""),
  device: z.enum(["Desktop", "Mobile", "Tablet", "Other"]).optional(),
  taskOutcome: z.enum(["Completed independently", "Completed with help", "Could not complete", "Not applicable"]).optional(),
  experienceScore: z.number().int().min(1).max(5).optional(),
  trustScore: z.number().int().min(1).max(5).optional(),
  learningDepthScore: z.number().int().min(1).max(5).optional(),
  recommendationScore: z.number().int().min(0).max(10).optional(),
  expectedResult: z.string().trim().max(2000).optional(),
  observedResult: z.string().trim().max(2000).optional(),
  languageContext: z.string().trim().max(200).optional(),
  regionalPerspective: z.string().trim().max(200).optional(),
  heardPronunciation: z.string().trim().max(200).optional(),
  spellingFromAudio: z.string().trim().max(200).optional(),
  nameAssociations: z.string().trim().max(2000).optional(),
  culturalFit: z.enum(["Credible", "Mostly credible", "Uncertain", "Forced", "Concerning"]).optional(),
});

export type BetaFeedbackInput = z.infer<typeof BetaFeedbackInput>;

export function accountDataRequestTemplate(value?: string) {
  const parsed = AccountDataRequestKind.safeParse(value);
  if (!parsed.success) return undefined;
  const common = {
    mode: "Issue report" as const,
    category: "Trust or data" as const,
    pageUrl: "/account",
  };
  if (parsed.data === "access") {
    return {
      ...common,
      kind: parsed.data,
      severity: "Medium" as const,
      summary: "Request access to my account data",
      details: "Please confirm what account data is held, provide the available export, and identify any data that requires a separate access process.",
    };
  }
  if (parsed.data === "correction") {
    return {
      ...common,
      kind: parsed.data,
      severity: "Medium" as const,
      summary: "Request correction of my account data",
      details: "Please review the account data I identify below, confirm the source of truth, and explain the correction and verification process before changing it.",
    };
  }
  return {
    ...common,
    kind: parsed.data,
    severity: "High" as const,
    summary: "Request account and data deletion",
    details: "Please verify my identity and confirm the deletion scope, required retention, export option, timing, and irreversible effects before removing my account or data.",
  };
}

export function launchIncidentReportTemplate(value?: string) {
  const parsed = LaunchIncidentSeverity.safeParse(value);
  if (!parsed.success) return undefined;
  const number = parsed.data.slice(-1);
  const severity = parsed.data === "severity-1"
    ? "Blocking" as const
    : parsed.data === "severity-2"
      ? "High" as const
      : parsed.data === "severity-3"
        ? "Medium" as const
        : "Low" as const;
  return {
    mode: "Issue report" as const,
    category: "Trust or data" as const,
    severity,
    pageUrl: "/launch-readiness",
    summary: `Launch incident — Severity ${number}`,
    details: "Record the affected journey and record IDs, exact reproduction steps, expected and observed result, data/privacy/authentication/valuation/trust impact, environment, timestamps, containment already taken, recovery evidence, and current owner.",
  };
}

export type BetaEvidenceRecord = {
  mode: BetaFeedbackMode;
  status: "Open" | "Reviewing" | "Resolved" | "Closed";
  severity: "Low" | "Medium" | "High" | "Blocking";
  summary?: string | null;
  page_url?: string | null;
  task_outcome?: string | null;
  trust_score?: number | null;
  learning_depth_score?: number | null;
  recommendation_score?: number | null;
  cultural_fit?: string | null;
};

export function isFounderAcceptanceTestRecord(record: Pick<BetaEvidenceRecord, "summary" | "page_url">) {
  return record.summary?.startsWith("[Founder test]") === true
    && record.page_url?.includes("founder") === true
    && record.page_url?.includes("acceptance") === true;
}

function average(values: Array<number | null | undefined>) {
  const present = values.filter((value): value is number => typeof value === "number");
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : undefined;
}

export function buildBetaEvidenceSummary(records: BetaEvidenceRecord[]) {
  const evidenceRecords = records.filter(record => !isFounderAcceptanceTestRecord(record));
  const active = evidenceRecords.filter(record => record.status === "Open" || record.status === "Reviewing");
  const sessions = evidenceRecords.filter(record => record.mode === "Session review");
  const cultural = evidenceRecords.filter(record => record.mode === "Name and culture");
  const independentCompletions = sessions.filter(record => record.task_outcome === "Completed independently").length;
  const trustAverage = average(sessions.map(record => record.trust_score));
  const learningAverage = average(sessions.map(record => record.learning_depth_score));
  const recommendationAverage = average(sessions.map(record => record.recommendation_score));
  const culturalConcern = cultural.some(record => record.cultural_fit === "Forced" || record.cultural_fit === "Concerning");
  const blocking = active.filter(record => record.severity === "Blocking").length;

  const gates = [
    { key: "critical-path", label: "Four independent critical-path completions", ready: independentCompletions >= 4, detail: `${independentCompletions} recorded` },
    { key: "trust", label: "Average trust score of at least 4/5", ready: trustAverage !== undefined && trustAverage >= 4, detail: trustAverage === undefined ? "No session scores" : `${trustAverage.toFixed(1)}/5` },
    { key: "learning", label: "Average learning-depth score of at least 4/5", ready: learningAverage !== undefined && learningAverage >= 4, detail: learningAverage === undefined ? "No session scores" : `${learningAverage.toFixed(1)}/5` },
    { key: "recommendation", label: "Average recommendation score of at least 8/10", ready: recommendationAverage !== undefined && recommendationAverage >= 8, detail: recommendationAverage === undefined ? "No session scores" : `${recommendationAverage.toFixed(1)}/10` },
    { key: "culture", label: "At least two cultural responses with no material concern", ready: cultural.length >= 2 && !culturalConcern, detail: culturalConcern ? "Material concern requires review" : `${cultural.length} response(s)` },
    { key: "blocking", label: "No unresolved blocking feedback", ready: blocking === 0, detail: blocking ? `${blocking} unresolved` : "Clear" },
  ];

  return {
    totalReports: evidenceRecords.length,
    openReports: active.length,
    sessionReviews: sessions.length,
    culturalReviews: cultural.length,
    independentCompletions,
    trustAverage,
    learningAverage,
    recommendationAverage,
    blocking,
    gates,
    readyCount: gates.filter(gate => gate.ready).length,
    ready: gates.every(gate => gate.ready),
  };
}
