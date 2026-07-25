export type BetaReadinessInput = {
  inviteOnly: boolean;
  serviceCredentials: boolean;
  migrationsReady: boolean;
  invited: number;
  signedUp: number;
  consented: number;
  backedUp: number;
  openFeedback: number;
  blockingFeedback: number;
};

export function buildBetaReadiness(input: BetaReadinessInput) {
  const gates = [
    {
      key: "invite-only",
      label: "Invitation-only enrollment",
      ready: input.inviteOnly,
      detail: input.inviteOnly ? "Uninvited email addresses are blocked." : "Set BETA_INVITE_ONLY=true before inviting testers.",
    },
    {
      key: "service",
      label: "Founder administration",
      ready: input.serviceCredentials,
      detail: input.serviceCredentials ? "Founder-only beta operations are available." : "Supabase service credentials are missing.",
    },
    {
      key: "migrations",
      label: "Consent and feedback records",
      ready: input.migrationsReady,
      detail: input.migrationsReady ? "Consent and beta feedback tables are available." : "Apply the beta-readiness migration.",
    },
    {
      key: "consent",
      label: "Age, privacy, and beta consent",
      ready: input.signedUp === 0 || input.consented === input.signedUp,
      detail: `${input.consented} of ${input.signedUp} signed-up testers have recorded consent.`,
    },
    {
      key: "backup",
      label: "Collector recovery points",
      ready: input.signedUp === 0 || input.backedUp === input.signedUp,
      detail: `${input.backedUp} of ${input.signedUp} signed-up testers have a recorded inventory backup.`,
    },
    {
      key: "blocking-feedback",
      label: "No unresolved blocking feedback",
      ready: input.blockingFeedback === 0,
      detail: input.blockingFeedback ? `${input.blockingFeedback} blocking issue(s) require resolution.` : "No blocking beta issues are open.",
    },
  ];
  const readyCount = gates.filter(gate => gate.ready).length;
  return {
    ...input,
    gates,
    readyCount,
    totalGates: gates.length,
    ready: readyCount === gates.length,
  };
}
