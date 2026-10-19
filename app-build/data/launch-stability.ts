import type { StabilityObservation } from "@/lib/stability-window";

// The October 19 candidate was invalidated when live acceptance found the
// Sensors route loading the complete climate archive. Freeze the corrected
// production artifact only after it is deployed and verified.
export const currentStabilityCandidate: string | undefined = undefined;
export const currentStabilityCandidateLabel: string | undefined = undefined;
export const launchStabilityObservations: StabilityObservation[] = [];
