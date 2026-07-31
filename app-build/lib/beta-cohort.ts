export const FOUNDER_BETA_SEAT_LIMIT = 25;

export function betaCohortSize(collectors: Array<{ stage: string }>) {
  return collectors.filter(collector => collector.stage !== "Prospect").length;
}

export function betaSeatsRemaining(collectors: Array<{ stage: string }>) {
  return Math.max(0, FOUNDER_BETA_SEAT_LIMIT - betaCohortSize(collectors));
}

export function assertBetaSeatAvailable(
  collectors: Array<{ id?: string; stage: string }>,
  candidate: { id?: string; stage: string },
) {
  if (candidate.stage === "Prospect") return;
  const cohortWithoutCandidate = collectors.filter(
    collector => collector.stage !== "Prospect" && (!candidate.id || collector.id !== candidate.id),
  );
  if (cohortWithoutCandidate.length >= FOUNDER_BETA_SEAT_LIMIT) {
    throw new Error(`The ${FOUNDER_BETA_SEAT_LIMIT}-collector founder cohort is full. Keep this collector as a Prospect until a seat is available.`);
  }
}
