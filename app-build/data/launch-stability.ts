import type { StabilityObservation } from "@/lib/stability-window";

// Frozen from the exact source, app artifact, and production verification
// recorded in PRODUCTION_RELEASE_CANDIDATE_2026-10-19.md. Human account and
// device acceptance remains open, so no stability day is inferred here.
export const currentStabilityCandidate: string | undefined = "7fecc5437937df1f83339501fa5e58079b89690ff45fa7f264dbcac24a29bd66";
export const currentStabilityCandidateLabel: string | undefined = "e82bd304 · hojavia-beta-shell-v4-c1704144324d";
export const launchStabilityObservations: StabilityObservation[] = [];
