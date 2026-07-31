export const requiredStabilityDays = 7;

export type StabilityObservation = {
  date: string;
  candidateFingerprint: string;
  productionLike: boolean;
  buildPassed: boolean;
  criticalJourneysPassed: boolean;
  automationHealthy: boolean;
  recordsReconciled: boolean;
  severityOneOpen: number;
  criticalPathSeverityTwoOpen: number;
  evidenceRef: string;
};

export type StabilityAssessment = {
  ready: boolean;
  daysCompleted: number;
  daysRequired: number;
  windowStart?: string;
  windowEnd?: string;
  nextRequiredDate?: string;
  reasons: string[];
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(left: string, right: string) {
  return Math.round((Date.parse(`${right}T00:00:00Z`) - Date.parse(`${left}T00:00:00Z`)) / 86_400_000);
}

function qualifies(item: StabilityObservation) {
  return item.productionLike && item.buildPassed && item.criticalJourneysPassed && item.automationHealthy && item.recordsReconciled && item.severityOneOpen === 0 && item.criticalPathSeverityTwoOpen === 0 && item.evidenceRef.trim().length > 0;
}

export function assessStabilityWindow(input: {
  currentCandidate?: string;
  observations: StabilityObservation[];
  asOf: string;
}): StabilityAssessment {
  const reasons: string[] = [];
  if (!validDate(input.asOf)) throw new Error("Stability assessment requires a valid as-of date.");
  if (!input.currentCandidate || !/^[a-f0-9]{64}$/.test(input.currentCandidate)) {
    return { ready: false, daysCompleted: 0, daysRequired: requiredStabilityDays, reasons: ["Freeze and record the release-candidate fingerprint before the stability window begins."] };
  }

  const current = input.observations
    .filter(item => item.candidateFingerprint === input.currentCandidate && validDate(item.date) && item.date <= input.asOf)
    .sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, StabilityObservation[]>();
  for (const item of current) byDate.set(item.date, [...(byDate.get(item.date) || []), item]);

  let run: string[] = [];
  for (const [date, items] of [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (items.length !== 1) {
      run = [];
      reasons.push(`Duplicate stability evidence exists for ${date}; that day cannot count.`);
      continue;
    }
    if (!qualifies(items[0])) {
      run = [];
      reasons.push(`${date} is incomplete or contains a blocking incident.`);
      continue;
    }
    if (run.length && daysBetween(run[run.length - 1], date) !== 1) {
      run = [];
      reasons.push(`Daily evidence is missing before ${date}; the consecutive window restarted.`);
    }
    run.push(date);
  }

  if (!run.length) {
    if (!current.length) reasons.push("No qualifying production-like day has been recorded for the current candidate.");
    return { ready: false, daysCompleted: 0, daysRequired: requiredStabilityDays, reasons: [...new Set(reasons)] };
  }

  const ready = run.length >= requiredStabilityDays;
  const window = ready ? run.slice(-requiredStabilityDays) : run;
  const last = window[window.length - 1];
  if (!ready && daysBetween(last, input.asOf) > 1) {
    reasons.push(`Daily evidence stopped after ${last}; the incomplete window expired.`);
    return { ready: false, daysCompleted: 0, daysRequired: requiredStabilityDays, reasons: [...new Set(reasons)] };
  }
  if (!ready) reasons.push(`${requiredStabilityDays - window.length} additional consecutive production-like day${requiredStabilityDays - window.length === 1 ? "" : "s"} required.`);

  return {
    ready,
    daysCompleted: ready ? requiredStabilityDays : window.length,
    daysRequired: requiredStabilityDays,
    windowStart: window[0],
    windowEnd: last,
    nextRequiredDate: ready ? undefined : addDays(last, 1),
    reasons: [...new Set(reasons)],
  };
}
