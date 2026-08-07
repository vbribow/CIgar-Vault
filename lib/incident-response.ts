export type IncidentSeverity = 1 | 2 | 3 | 4;

export const incidentSeverityStandard = [
  {
    severity: 1 as const,
    label: "Stop and contain",
    definition: "Data loss, cross-user exposure, account takeover, unrecoverable corruption, materially false portfolio total, or a critical journey unavailable.",
    launchEffect: "Hold invitations and launch activity immediately.",
  },
  {
    severity: 2 as const,
    label: "Critical-path hold",
    definition: "A critical journey completes incorrectly or requires founder intervention while data remains recoverable and isolated.",
    launchEffect: "Hold the affected journey and any launch gate that depends on it.",
  },
  {
    severity: 3 as const,
    label: "Material correction",
    definition: "Material friction or misleading presentation outside the critical path.",
    launchEffect: "Track to correction; escalate if scope or consequence grows.",
  },
  {
    severity: 4 as const,
    label: "Routine improvement",
    definition: "Cosmetic or low-impact behavior with no trust or critical-path consequence.",
    launchEffect: "Record and prioritize normally.",
  },
] as const;

export const immediateIncidentActions = [
  "Stop new invitations and affected launch activity for Severity 1 or critical-path Severity 2 incidents.",
  "Create one private incident record with severity, journey, record IDs, environment, timestamps, reproduction steps, expected and observed behavior, impact, containment, and owner.",
  "Preserve the affected collector's complete export, recovery point, relevant screenshots, logs, and source evidence without copying unnecessary private collection details.",
  "Contain access, automation, deployment, or the affected feature without deleting evidence or asking a collector to perform an unverified restore.",
  "Use a founder-controlled or synthetic account to prove recovery before involving an affected collector.",
  "Record the correction, regression evidence, recovery result, residual risk, and explicit reopen decision in the same incident record.",
] as const;

export type IncidentClosureEvidence = {
  contained: boolean;
  rootCauseRecorded: boolean;
  correctionVerified: boolean;
  regressionCoverage: boolean;
  recoveryVerified: boolean;
  affectedRecordsReconciled: boolean;
  feedbackResolved: boolean;
  launchGateReassessed: boolean;
  ownerApprovedReopen: boolean;
};

export function incidentClosureDecision(evidence: IncidentClosureEvidence) {
  const requirements = [
    ["Containment remains effective", evidence.contained],
    ["Root cause is recorded", evidence.rootCauseRecorded],
    ["Correction is verified in the affected environment", evidence.correctionVerified],
    ["Regression coverage protects the failed behavior", evidence.regressionCoverage],
    ["Recovery is verified without assuming success", evidence.recoveryVerified],
    ["Affected records and totals reconcile", evidence.affectedRecordsReconciled],
    ["The incident record is resolved with evidence", evidence.feedbackResolved],
    ["Every affected launch gate is reassessed", evidence.launchGateReassessed],
    ["The accountable owner explicitly approves reopening", evidence.ownerApprovedReopen],
  ] as const;
  const missing = requirements.filter(([, complete]) => !complete).map(([label]) => label);
  return {
    readyToReopen: missing.length === 0,
    missing,
  };
}
