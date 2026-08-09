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
  recordedAt: "2026-08-07",
  build: "Passed",
  typecheck: "Passed",
  automatedTests: {
    passed: 928,
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
    evidence: "Every inventory editor, story correction, collection save, membership correction, and photo update rejects stale device state. On July 30, the repaired physical-phone Vault loaded successfully, synchronized quantity 3 to the desktop, rejected a stale desktop overwrite, and restored INV-0007 to its original quantity 1. An August 6 read-only production check reached the authenticated Vault, Log a Smoke, photo intake, Cigar Somm, Collections, Reports, and Account routes without a server error. Story, collection-component, storage, and second-device observations remain incomplete.",
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
    status: "Passed",
    detail: "Complete the source-backed audit of every known collection and presentation asset.",
    evidence: "All 21 researched templates pass one exact-lot, attributable-source, quantity-reconciliation protocol. On August 7 the protected live record workflow reconciled the two El Tributo physical boxes without merging or deleting either lot: INV-0014 remains 15/15 with exact vitola El Tributo, collector-supplied 2025 release year, and box 1 provenance; INV-0015 remains 15/15 with exact vitola El Tributo, collector-supplied 2026 release year, and box 2 provenance. Both live detail pages were reloaded and verified after save.",
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
    evidence: "Automated mobile safeguards are green and one physical-phone quantity synchronization path has passed. On August 6, 928 tests, type checking, the 181-route navigation audit, and the production build passed. A local rollback rehearsal verified 278 files (13,002,204 bytes) under artifact SHA-256 419849e374a0c756d3d5f1f06a7c8f9271e56a859ec77a541f7963b2543bb587, rejected damage, and restored the prior artifact without production or collector-data changes. Eight authenticated production routes loaded read-only without a server error. The August 7 live El Tributo reconciliation closed the collection-data hold. The production dashboard confirmed both formerly colliding schema changes are deployed but no Supabase migration ledger exists; the local filename collision is reconciled, while a reviewed production baseline transaction remains required. The candidate remains unfrozen and the clock stays at 0/7 because that baseline and physical iPhone/Android plus recovery acceptance remain incomplete.",
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

export const launchDeviceMatrix = [
  { platform: "iPhone", browser: "Safari", installedApp: "Add to Home Screen", status: "Partial", next: "Complete photo, navigation, sign-out, reopen, and second-device synchronization with a beta tester." },
  { platform: "Android", browser: "Chrome", installedApp: "Install app", status: "Not run", next: "Complete the same journey on a physical Android phone; emulator evidence cannot replace it." },
] as const;

export const founderGoNoGoChecklist = [
  { gate: "Release candidate", status: "Hold", detail: "Resolve the production migration ledger and complete physical-device recovery acceptance before freezing the verified artifact and starting day one." },
  { gate: "Database migrations", status: "Hold", detail: "The local collision is resolved. Create a reviewed production migration baseline only after backup and explicit approval; the production project currently has no Supabase migration ledger." },
  { gate: "Beta evidence", status: "Hold", detail: "Complete physical-device, recovery, and second-device sessions with approved identities." },
  { gate: "Brand and legal", status: "Founder decision", detail: "Record clearance advice, legal owner/state, support owner, incident owner, and dated adoption decision." },
  { gate: "Google Places", status: "Deferred external", detail: "Configure restricted production credentials immediately before public lounge launch." },
  { gate: "Billing", status: "Founder decision", detail: "Choose free beta or authorize a Stripe test-mode acceptance pass before any paid cohort." },
  { gate: "Sensors", status: "Deferred", detail: "Resume only when Brian is home and available to link the physical sensors." },
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
