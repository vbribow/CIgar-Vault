export type LaunchGateStatus = "Passed" | "In progress" | "Not started" | "Deferred";

export type LaunchGate = {
  id: string;
  title: string;
  status: LaunchGateStatus;
  detail: string;
  evidence: string;
  priority: "Now" | "Next" | "Later";
  owner: string;
  evidenceDate: string;
  nextAction: string;
};

export const launchBaseline = {
  recordedAt: "2026-10-07",
  build: "Passed",
  typecheck: "Passed",
  automatedTests: {
    passed: 1186,
    failed: 0,
  },
  severityOneOpen: 0,
  severityTwoCriticalPathOpen: 0,
  affiliateReview: "Deferred until after launch",
} as const;

const launchGateDefinitions = [
  {
    id: "brand-clearance-adoption",
    title: "Trademark, legal, and public-release readiness",
    status: "In progress",
    detail: "Complete the remaining trademark, policy, support, and public-release decisions under the adopted Hojavía identity.",
    evidence: "Hojavía was adopted on August 12, 2026 with Emberward Holdings LLC as owner; the Arizona entity is active. The federal intent-to-use application package, chain-of-title confirmation, final legal and privacy review, support ownership, and founder approval of filing and release remain open. Formation did not submit or pay for a trademark application.",
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
    id: "sensor-continuity",
    title: "Current humidor readings and unattended recovery",
    status: "In progress",
    detail: "Bring every linked SensorPush device current and prove hourly synchronization remains current without manual intervention.",
    evidence: "All five devices are linked and production readings were current on October 7. Two consecutive hourly synchronization cycles returned HTTP 200. Long-history calculations and scheduled reading pagination passed 100,000- and 150,000-reading regressions locally; continuity through the seven-day stability window remains open.",
    priority: "Now",
  },
  {
    id: "places-scope-acceptance",
    title: "Google Places launch scope and lounge-search acceptance",
    status: "In progress",
    detail: "Decide whether lounge discovery ships in the first web release and close every external-service control if it does.",
    evidence: "Automated coverage enforces ZIP/city input, radius, lounge-only filtering, attribution, rating closure, daily limits, and monthly refresh. Production acceptance and the explicit founder scope decision remain open.",
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
    id: "openai-research-activation",
    title: "OpenAI research billing and production activation",
    status: "Not started",
    detail: "Keep paid research disabled until a dedicated OpenAI Platform project, approved hard spending limit, alerts, protected production key, research ledger migration, and founder acceptance query pass are complete.",
    evidence: "The no-billing foundation is implemented locally: the service fails closed by default, exposes readiness, enforces a daily user allowance, deduplicates requests, caches exact research, verifies visited-source provenance, records usage without private prompts, and maps provider failures to recoverable messages. OPENAI_RESEARCH_ENABLED remains unset, no API key was added, no billing was started, and migration 202608090001 has not been applied. Activation requires Brian’s separate approval after the database baseline is reconciled.",
    priority: "Next",
  },
  {
    id: "stability-device-acceptance",
    title: "Device coverage and stability window",
    status: "In progress",
    detail: "Complete the required browser/device matrix and sustain seven production-like days without a Severity 1 or critical-path Severity 2 defect.",
    evidence: "On October 7, the exact local candidate passed 1,186 tests, TypeScript, the 193-route navigation audit, seven critical journey checks, mobile reliability, source and built-asset performance budgets, production builds for the private app and separate public website, and a local rollback rehearsal without production or collector-data changes. The candidate remains undeployed and the clock stays at 0/7 until deployment is separately approved and physical iPhone/Android, recovery, sensor-continuity, and second-device acceptance are complete.",
    priority: "Next",
  },
  {
    id: "legal-owner",
    title: "Legal owner and formation state",
    status: "Passed",
    detail: "Keep the approved owner and formation state explicit while the separate trademark and public-release legal gate remains open.",
    evidence: "Brian selected Emberward Holdings LLC as owner on August 12, 2026. Arizona approved its Articles of Organization on August 13, 2026; Business ID 25108068 is recorded active. This does not represent trademark clearance or filing.",
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

const launchGateAccountability: Record<(typeof launchGateDefinitions)[number]["id"],Pick<LaunchGate,"owner"|"evidenceDate"|"nextAction">> = {
  "brand-clearance-adoption": {owner:"Brian + qualified legal reviewer",evidenceDate:"2026-10-07",nextAction:"Approve counsel and complete the dated legal, privacy, support-owner, and filing decisions."},
  "automation-privacy": {owner:"Technical owner",evidenceDate:"2026-10-07",nextAction:"Retain the passing controls in the frozen release candidate."},
  "sensor-continuity": {owner:"Technical owner + Brian",evidenceDate:"2026-10-07",nextAction:"Deploy the validated pagination fixes only after approval, then record seven current production days."},
  "places-scope-acceptance": {owner:"Brian + technical owner",evidenceDate:"2026-10-07",nextAction:"Record the founder scope decision and complete the production ZIP, radius, attribution, rating, budget, and refresh acceptance script."},
  "cross-device-sync": {owner:"Brian + beta tester",evidenceDate:"2026-10-07",nextAction:"Run the remaining story, collection-component, storage, and second-device checks."},
  "photo-completion": {owner:"Brian + beta tester",evidenceDate:"2026-10-07",nextAction:"Complete the physical-phone upload, retry, correction, and saved-record protocol."},
  "import-recovery": {owner:"Brian + technical owner",evidenceDate:"2026-10-07",nextAction:"Complete representative UI commit, rollback, export, restore, and second-device observations."},
  "founder-beta": {owner:"Brian",evidenceDate:"2026-10-07",nextAction:"Inspect the protected cohort counts and resolve blocking feedback without widening access."},
  "auth-isolation-recovery": {owner:"Brian + technical owner",evidenceDate:"2026-10-07",nextAction:"Complete clean-browser recovery, representative restore, and second-device account-isolation acceptance."},
  "collection-truth": {owner:"Technical owner",evidenceDate:"2026-08-07",nextAction:"Retain the passing evidence and investigate only newly reported identity conflicts."},
  "valuation-coverage": {owner:"Technical owner",evidenceDate:"2026-07-30",nextAction:"Retain evidence gaps explicitly and refresh only under the approved monthly policy."},
  "legal-privacy-support": {owner:"Brian + qualified reviewer + support owner needed",evidenceDate:"2026-10-07",nextAction:"Name support and incident owners, approve notices and retention rules, and rehearse an authorized deletion request."},
  "billing-entitlements": {owner:"Brian + technical owner",evidenceDate:"2026-10-07",nextAction:"Choose free beta or separately authorize the Stripe test-mode acceptance runbook."},
  "openai-research-activation": {owner:"Brian",evidenceDate:"2026-10-07",nextAction:"Keep disabled unless a separate budget, credential, migration, and controlled-query approval is granted."},
  "stability-device-acceptance": {owner:"Brian + beta testers",evidenceDate:"2026-10-07",nextAction:"Deploy the frozen candidate after approval, complete the physical-device matrix, and start the seven-day clock."},
  "legal-owner": {owner:"Brian",evidenceDate:"2026-08-13",nextAction:"Preserve Emberward Holdings LLC as the recorded owner; chain-of-title and trademark filing remain under the separate legal gate."},
  "affiliate-programs": {owner:"Brian",evidenceDate:"2026-07-29",nextAction:"Keep deferred until after launch and separate approval."},
};

export const launchGates: readonly LaunchGate[] = launchGateDefinitions.map(gate=>({...gate,...launchGateAccountability[gate.id]}));

export const launchDeviceMatrix = [
  { platform: "iPhone", browser: "Safari", installedApp: "Add to Home Screen", status: "Partial", next: "Complete photo, navigation, sign-out, reopen, and second-device synchronization with a beta tester." },
  { platform: "Android", browser: "Chrome", installedApp: "Install app", status: "Not run", next: "Complete the same journey on a physical Android phone; emulator evidence cannot replace it." },
] as const;

export const betaValueJourney = [
  {
    id: "photo-intake",
    task: "Add one cigar by photo",
    success: "The collector reviews the proposed identity, saves exactly one physical lot, sees a clear confirmation, and opens that exact saved record.",
    route: "/inventory?add=new#mobile-intake",
    evidence: "Record ID, before/after quantity, saved-record screenshot, and confirmation that no duplicate lot was created.",
  },
  {
    id: "correct-details",
    task: "Correct the cigar's details",
    success: "Edit all details opens the exact row directly, preserves unrelated fields, saves once, and returns to the corrected record without a navigation loop.",
    route: "/inventory#inventory-records",
    evidence: "Changed field, unchanged comparison fields, revision result, and corrected-record screenshot.",
  },
  {
    id: "log-smoke",
    task: "Log one smoking experience",
    success: "The collector chooses whether the cigar came from the Vault, receives one persistent success message, and inventory changes only when explicitly selected.",
    route: "/records#log-smoke",
    evidence: "Smoke entry ID, selected source mode, exact quantity before/after, and confirmation that a repeated tap created no duplicate.",
  },
  {
    id: "find-entry",
    task: "Find the cigar and smoke afterward",
    success: "Vault search and the Smoke Journal both find the expected record, preserve the return path, and agree on identity, quantity, and score.",
    route: "/smoke-journal",
    evidence: "Search terms, matched record IDs, journal result, and return-navigation result.",
  },
  {
    id: "learn-and-decide",
    task: "Use education or Cigar Somm to make a decision",
    success: "The collector reaches useful, source-aware guidance from the cigar record without exposing private notes or mistaking research leads for verified facts.",
    route: "/cigar-somm",
    evidence: "Starting record, selected learning or decision path, usefulness note, source visibility, and any uncertainty the collector noticed.",
  },
] as const;

export const webLaunchCriticalJourneys = [
  { id:"account", name:"Enter and recover the account", route:"/account", automated:"Passed", live:"Required", evidence:"Sign in from a clean browser, request password recovery, return to the account, and confirm another account cannot see the collector's records." },
  { id:"vault", name:"Add, edit, find, and safely remove a Vault lot", route:"/inventory", automated:"Passed", live:"Required", evidence:"Use one disposable lot on desktop and the installed phone; verify one save, exact-record return, cross-device visibility, duplicate protection, and deliberate deletion." },
  { id:"smoke", name:"Log a smoke with and without Vault deduction", route:"/records#log-smoke", automated:"Passed", live:"Required", evidence:"Save one Vault smoke and one outside-Vault smoke; verify clear confirmation, correct quantity change, editable score, journal visibility, and no duplicate from a repeated tap." },
  { id:"rankings", name:"See My Top 10 and Hojavía 25", route:"/community?tab=ratings#my-top-10", automated:"Passed", live:"Observed", evidence:"Production API and signed-in display currently return 10 personal entries and 25 community entries; recheck after the release candidate is deployed." },
  { id:"sensors", name:"See current humidor readings", route:"/sensors", automated:"Passed", live:"Catching up", evidence:"All five SensorPush devices are linked. The bounded hourly recovery must reach current time and remain current through the stability window." },
  { id:"places", name:"Find and rate a real cigar lounge", route:"/places", automated:"Passed", live:"Required", evidence:"Before inclusion in launch scope, verify ZIP/city search, radius, lounge-only results, website and Google attribution, rating save/close, daily cost guardrail, and monthly refresh." },
] as const;

export const founderGoNoGoChecklist = [
  { gate: "Release candidate", status: "Hold", detail: "Deploy the combined stability batch, complete physical-device acceptance, then freeze the verified web artifact and start day one of the seven-day window." },
  { gate: "Database migrations", status: "Hold", detail: "The local collision is resolved. Create a reviewed production migration baseline only after backup and explicit approval; the production project currently has no Supabase migration ledger." },
  { gate: "Beta evidence", status: "Hold", detail: "Complete physical-device, recovery, and second-device sessions with approved identities." },
  { gate: "Brand and legal", status: "Founder decision", detail: "Record clearance advice, legal owner/state, support owner, incident owner, and dated adoption decision." },
  { gate: "Google Places", status: "Founder scope decision", detail: "If included at web launch, complete restricted credentials, production migration, lounge-only ZIP/radius acceptance, attribution, ratings, cost controls, and monthly refresh verification before freezing the candidate." },
  { gate: "Billing", status: "Founder decision", detail: "Choose free beta or authorize a Stripe test-mode acceptance pass before any paid cohort." },
  { gate: "Live cigar research", status: "Hold — billing required", detail: "Create a dedicated OpenAI Platform project, approve its hard spending limit and alerts, apply the research-ledger migration after database reconciliation, add the protected production key, set OPENAI_RESEARCH_ENABLED=true, and pass the founder’s controlled research evaluation." },
  { gate: "Sensors", status: "Current — stability open", detail: "All five devices were current on October 7 and two consecutive hourly cycles succeeded. The seven-day stability window remains open." },
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
