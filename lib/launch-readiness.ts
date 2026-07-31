export type LaunchGateStatus = "Passed" | "In progress" | "Not started" | "Deferred";

export type LaunchGate = {
  id: string;
  title: string;
  status: LaunchGateStatus;
  detail: string;
  evidence: string;
  priority: "Now" | "Next" | "Later";
};

export const launchBaseline = {
  recordedAt: "2026-07-30",
  build: "Passed",
  typecheck: "Passed",
  automatedTests: {
    passed: 730,
    failed: 0,
  },
  severityOneOpen: 0,
  severityTwoCriticalPathOpen: 0,
  affiliateReview: "Deferred until after launch",
} as const;

export const launchGates: readonly LaunchGate[] = [
  {
    id: "brand-clearance-adoption",
    title: "Brand clearance, confidential disclosure, and adoption",
    status: "In progress",
    detail: "Keep Hojavía private and reversible until the participant-disclosure, linguistic, trademark, common-law, registry, digital, residual-risk, and dated founder-adoption gates are complete.",
    evidence: "Preliminary strategy, exact-domain, exact-mark, app-store, and partial handle screens are preserved. The live HOVIA record still requires attorney-grade assessment; business-registry scope awaits owner and state facts; confidential beta linguistic evidence, remaining digital refreshes, founder residual-risk acceptance, and a dated adoption decision remain incomplete. No public launch, rename, filing, purchase, claim, or campaign is authorized.",
    priority: "Now",
  },
  {
    id: "automation-privacy",
    title: "Unattended automation safety",
    status: "Passed",
    detail: "Honor collector preferences, require authorization, bound external work, and preserve durable evidence across scheduled operations.",
    evidence: "Preference-aware research, notifications, and analytics stop when choices cannot be verified. Every scheduled route requires authorization; monthly location verification is bounded, timed out, and cannot report success before both durable evidence writes pass.",
    priority: "Now",
  },
  {
    id: "cross-device-sync",
    title: "Cross-device inventory synchronization",
    status: "In progress",
    detail: "Verify quantity, price, story, and collection edits from one signed-in device on another.",
    evidence: "Every inventory editor, story correction, collection save, membership correction, and photo update rejects stale device state. On July 30, the repaired physical-phone Vault loaded successfully, synchronized quantity 3 to the desktop, rejected a stale desktop overwrite, and restored INV-0007 to its original quantity 1. The runtime defect is closed; story, collection-component, and storage observations remain in Session A.",
    priority: "Now",
  },
  {
    id: "photo-completion",
    title: "Photo intake and edit completion",
    status: "In progress",
    detail: "Confirm upload, success feedback, saved-record attachment, correction, and retry behavior.",
    evidence: "Automated coverage verifies format signatures, owner isolation, stale-save protection, replacement cleanup, upload reconciliation, and direct saved-record retry; the physical-phone and production-storage protocol is ready in the founder acceptance runbook.",
    priority: "Now",
  },
  {
    id: "import-recovery",
    title: "Inventory import and recovery",
    status: "In progress",
    detail: "Exercise CSV/XLSX preview, duplicate handling, malformed rows, rollback, and account isolation.",
    evidence: "Automated checks cover safe previews, duplicate acknowledgement, malformed files, all-or-nothing commits, edit-safe rollback, explicit owner isolation, and recovery conflicts. On July 30, equivalent synthetic CSV/XLSX fixtures both classified 2 valid rows, 2 invalid rows, and 1 duplicate with no commit; unreadable workbooks now fail closed with an actionable re-export message. Representative founder-file UI, commit, rollback, and second-device observations remain.",
    priority: "Now",
  },
  {
    id: "founder-beta",
    title: "Founder Beta safeguards",
    status: "In progress",
    detail: "Require invitation-only enrollment, healthy administration data, migrations, consent, recovery points, and no unresolved blocking feedback.",
    evidence: "The gate fails closed when authentication, cohort, consent, feedback, or backup evidence is unavailable. A July 30 read-only check confirmed the live onboarding queue exposes no cohort data without the Founder key. Brian must enter that credential in the private local screen before the readiness counts can be inspected; no invitation, email, or cohort mutation is authorized by that check.",
    priority: "Now",
  },
  {
    id: "auth-isolation-recovery",
    title: "Authentication, tenant isolation, recovery, and exports",
    status: "In progress",
    detail: "Prove clean-browser account access, owner isolation, password recovery, complete export, and backup restoration in the production-like environment.",
    evidence: "Automated coverage verifies account-scoped reads and writes, safe redirect handling, recovery-link behavior, complete private export, recovery-point creation, conflict-aware restore, and fail-closed dependency handling. Clean-browser recovery, representative backup restore, and second-device confirmation remain live acceptance work.",
    priority: "Now",
  },
  {
    id: "collection-truth",
    title: "Collection and catalog truth",
    status: "In progress",
    detail: "Complete the source-backed audit of every known collection and presentation asset.",
    evidence: "All 21 researched templates pass one exact-lot, attributable-source, quantity-reconciliation protocol; the founder’s highest-value source pages were rechecked July 29. The July 30 live account audit found two legacy Father & Son presentation rows linked to a missing collection ID; they remain review-only until the two physical boxes can be reconciled without double counting.",
    priority: "Next",
  },
  {
    id: "valuation-coverage",
    title: "Defensible valuation coverage",
    status: "Passed",
    detail: "Reach at least 90% of founder inventory value or document every remaining evidence gap.",
    evidence: "The July 30 live workspace reports all 132 active cigar lots current under the evidence policy: 106 have source-linked retail replacement coverage (80%), 31 have aftermarket evidence (23%), and 30 current evidence gaps are explicitly deferred. The eligible research queue is zero, the exact-match reuse pass found no additional supported prices, and no value was invented. Presentation assets remain excluded; Habanos, Fox, and evidence-quality rules remain intact.",
    priority: "Next",
  },
  {
    id: "legal-privacy-support",
    title: "Privacy, terms, support, and incident readiness",
    status: "In progress",
    detail: "Keep founder-beta policies drafted and make public-launch policies, deletion, support, incident, and correction paths approved, reachable, and tested.",
    evidence: "Private routes and internal operating standards exist for privacy, terms, beta participation, feedback, export, recovery, trust corrections, and incident response. Signed-in collectors can create auditable access, correction, and deletion requests without destructive action. Founder launch control now provides consistent Severity 1–4 classification, safe prefilled incident intake, containment and recovery steps, and fail-closed reopen criteria. Final owner-specific legal review, retention rules, public publication approval, authorized deletion rehearsal, support ownership, and live incident-response acceptance remain incomplete.",
    priority: "Next",
  },
  {
    id: "billing-entitlements",
    title: "Billing and entitlement readiness",
    status: "In progress",
    detail: "Test products, checkout, webhooks, entitlements, receipts, cancellation, and reconciliation before any paid cohort.",
    evidence: "Paid entitlements now fail closed unless checkout proves a paid or no-payment-required session with an active/trialing expanded subscription, customer, and subscription ID. Signed subscription and invoice lifecycle events reconcile active, trialing, past-due, canceled, unpaid, incomplete, and paused states; canceled or failed billing cannot retain paid access. The test-mode acceptance runbook is ready, but no credentialed checkout, webhook delivery, receipt, portal, cancellation, reconciliation, or support-path acceptance is recorded. No live charge is authorized.",
    priority: "Next",
  },
  {
    id: "stability-device-acceptance",
    title: "Device coverage and stability window",
    status: "In progress",
    detail: "Complete the required browser/device matrix and sustain seven production-like days without a Severity 1 or critical-path Severity 2 defect.",
    evidence: "One physical-phone quantity synchronization path has passed and automated mobile safeguards are green. A July 30 semantic browser baseline across ten critical routes passed landmark, heading, naming, image-alt, duplicate-ID, language, and overflow checks after two missing control names were corrected. A follow-up at 320 by 640 CSS pixels passed all ten routes without page-level horizontal overflow; five critical routes also passed rendered focus-order structure, skip-destination, native tabindex, control-naming, and labeled checkbox-target checks. Shared focus-visible and reduced-motion behavior is regression-covered. All 79 static page templates now pass rendered deterministic-background contrast checks, and current photographic captions retain at least 10.39:1 even under a worst-case white-image composite. A guarded local rehearsal verified 215 release files, rejected an invalid candidate before activation, detected simulated damage, and restored the prior artifact by SHA-256 without changing production or user data. The static database review found no direct destructive DDL but did find two local migrations sharing version 202607240001; Supabase’s timestamp-based remote ledger must be compared before either file is renamed or any schema release occurs. A fail-closed stability ledger now requires seven distinct consecutive production-like days for one frozen artifact and resets for candidate drift, missing or duplicate days, incomplete evidence, or a blocking incident; no candidate is frozen, so the clock remains honestly at 0/7. Screen-reader, physical keyboard-only journeys, browser/text-only zoom, future dynamic-image review, full iPhone/Android/Safari/Chrome, production-provider and database recovery, migration-history reconciliation, and seven-day stability acceptance remain incomplete.",
    priority: "Next",
  },
  {
    id: "legal-owner",
    title: "Legal owner and launch state",
    status: "Deferred",
    detail: "Record the approved owner, formation state, principal state, and legal-document transition.",
    evidence: "Founder reminder is active; no owner or state is inferred.",
    priority: "Later",
  },
  {
    id: "affiliate-programs",
    title: "Affiliate program agreements",
    status: "Deferred",
    detail: "Review retailer agreements after launch without allowing compensation to influence evidence or ranking.",
    evidence: "Founder deferred this work on July 29; all tracking remains disabled.",
    priority: "Later",
  },
] as const;

export function launchReadinessSummary() {
  const blockingDefects = launchBaseline.severityOneOpen + launchBaseline.severityTwoCriticalPathOpen;
  const blockingGates = launchGates.filter(
    gate => gate.status === "In progress" || gate.status === "Not started",
  ).length;
  return {
    passed: launchGates.filter(gate => gate.status === "Passed").length,
    active: launchGates.filter(gate => gate.status === "In progress").length,
    deferred: launchGates.filter(gate => gate.status === "Deferred").length,
    blockingDefects,
    blockingGates,
    decision: blockingDefects === 0 && blockingGates === 0 ? "READY" : "HOLD",
  };
}
