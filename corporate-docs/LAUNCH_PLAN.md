# Document 015 — Cedriva Launch Schedule

**Version:** 1.4
**Status:** Active operating plan  
**Owner:** Brian Bowers  
**Engineering owner:** Codex  
**Baseline date:** July 24, 2026  
**Last Updated:** July 30, 2026
**Founder Beta target:** September 21, 2026  
**Public Launch target:** October 26, 2026  

> **Brand transition:** Cedriva is a retired legacy placeholder in this
> document’s title and historical references. Hojavía (pronounced oh-ha-VEE-ah) is a clearance candidate,
> not an adopted brand. This operating schedule governs the platform regardless
> of the replacement name and does not authorize a public rename.

## Launch principle

The platform will launch when it is trustworthy, not merely when it is
feature-rich.

The launch path must answer the four constitutional questions:

- Does this educate?
- Does this build trust?
- Does this strengthen the community?
- Does this preserve the culture?

The public-launch date is conditional. A failed launch gate moves the date; it does not lower the standard.

**Current launch decision:** **HOLD.** A clean build and zero critical defects
do not make the platform launch-ready while product acceptance or replacement-
brand clearance gates remain incomplete.

## Product boundary

### Required for Founder Beta

- Reliable account creation, sign-in, password recovery, and tenant isolation
- Mobile-first inventory entry, photo identification, correction, and synchronization
- Safe CSV/XLSX inventory import with preview, validation, and rollback protection
- Accurate collection membership, component population, release-year handling, and inventory linkage
- Retail valuation for sticks, boxes, collections, and non-cigar presentation assets
- Clearly separated retail, documented sale, and estimated secondary-market values
- Working Cigar Somm analysis for an exact cigar, with transparent uncertainty and useful pairings
- Working smoking log, reports, CSV/PDF export, and private-record export
- Founder moderation and operational health controls
- Navigation, copy, typography, imagery, and mobile behavior aligned with the
  replacement identity after its explicit adoption

### Required for Public Launch

- All Founder Beta requirements sustained in production
- Stripe plans, checkout, entitlements, receipts, cancellation, and support path
- Published privacy policy, terms, valuation disclaimer, community rules, and data-deletion process
- Backup and recovery rehearsal
- Accessibility, security, performance, and browser/device acceptance
- Support intake, incident response, and launch-day ownership
- Analytics for activation, retention, errors, research cost, and valuation coverage

### Feature-flagged or deferred

- Google Places discovery may remain disabled until pre-launch activation and cost testing
- Cedriva Certified location reviews begin as a founder-curated pilot
- Auction-house integrations remain evidence links or manual ingestion until partner agreements exist
- New World secondary-market estimates must be labeled as estimates until transaction evidence develops
- Retail/POS integrations, open marketplace transactions, and broad manufacturer portals follow launch

## Schedule

### Phase 0 — Baseline and freeze the launch contract
**July 24–26**

- Record the launch scope and stop adding non-critical launch features.
- Capture the current production environment, migrations, cron jobs, secrets, and feature flags.
- Establish one defect list with severity, owner, reproduction steps, and verification status.
- Run the full build, typecheck, tests, and production-route smoke checks.
- Confirm which repository documents are guidance versus application content.

**Exit gate:** One prioritized launch backlog exists; the main branch builds; no unknown deployment blocker remains.

### Week 1 — Data integrity and synchronization
**July 27–August 2**

- Prove quantity edits synchronize across mobile and web.
- Verify photo upload completes, reports success, and never remains visually frozen.
- Audit inventory writes, collection writes, activity records, and user isolation.
- Test CSV/XLSX import preview, duplicate handling, malformed rows, and safe recovery.
- Reconcile Smartsheet and Supabase responsibilities and document the authoritative source for each record type.

**Exit gate:** A change made on one device appears correctly on another; imports cannot silently overwrite or cross user boundaries.

### Week 2 — Collection and catalog truth
**August 3–9**

- Audit every known collection as collection, standalone cigar, or both.
- Correct Dream to Dynasty, Purple Dream, Legends, and other presentation-set membership.
- Populate documented collection components into individual inventory with collection references.
- Separate collection release year from each cigar’s production or release year.
- Validate intelligent vitola choices against the exact line; retain a transparent manual path.
- Add or verify licensed/attributed collection imagery.

**Exit gate:** No known collection contains invented, missing, or wrongly linked components; ambiguous facts are visibly labeled.

### Week 3 — Valuation completion
**August 10–16**

- Assign initial retail values rapidly when inventory is added.
- Reuse a verified canonical value for identical cigars across users.
- Separate retail value, documented completed-sale value, and estimated secondary-market value.
- Normalize stick, box, presentation, and humidor values without double counting.
- Apply the humidor residual method only where cigar and package evidence support it.
- Raise the founder inventory’s defensible valuation coverage from the current partial state toward 90% or document every remaining gap.
- Validate insurance CSV and PDF output.

**Exit gate:** At least 90% of founder inventory value is supported or explicitly marked unresolved; totals reconcile to line items.

### Week 4 — Core experience and Cigar Somm trust
**August 17–23**

- Require the exact cigar before analyzing a multi-cigar collection.
- Preserve standalone analysis when the same cigar also belongs to a collection.
- Distinguish tasting profiles and aging guidance by exact cigar and vitola.
- Return named, supportable spirit, cocktail, coffee, and nonalcoholic pairings.
- Ensure empty research or pairing evidence becomes a candid explanation, never a blank panel.
- Improve response structure and perceived speed.
- Verify discovery, learning journeys, community posting, ratings, and navigation destinations.

**Exit gate:** Ten representative Somm scenarios and all primary journey buttons pass founder acceptance without factual conflation.

### Week 5 — Accounts, mobile, and operational controls
**August 24–30**

- Re-test sign-up, sign-in, sign-out, password recovery, newest-link handling, and rate-limit messaging.
- Verify mobile installability, camera/photo intake, editing, offline messaging, and responsive layouts.
- Confirm founder moderation, health checks, alerting, backup, and recovery controls.
- Complete privacy/security review for uploads, imports, keys, user records, and administrative actions.
- Remove production dead ends and replace configuration errors with useful founder-facing guidance.

**Exit gate:** Authentication passes clean-browser and mobile tests; no critical workflow depends on founder intervention.

### Week 6 — Founder Alpha
**August 31–September 6**

- Onboard 3–5 trusted collectors with varied collection sizes.
- White-glove their imports and observe first-use behavior.
- Measure: account activation, first 20 cigars, first photo, first edit, first valuation, first report, and first Somm session.
- Resolve every severity-1 and severity-2 defect before adding scope.
- Interview each participant and record repeated friction.

**Exit gate:** At least four collectors complete the critical path; no data-loss, privacy, authentication, or valuation-total defect remains open.

### Week 7 — Commercial and legal readiness
**September 7–13**

- Configure Stripe products, prices, checkout, webhooks, entitlements, receipts, cancellation, and test transactions.
- Finalize Founder Beta offer, capacity, onboarding promise, and support response expectations.
- Publish privacy, terms, community rules, valuation methodology/disclaimer, and deletion/export instructions.
- Add error and cost dashboards for OpenAI, Supabase, Vercel, email, and scheduled research.
- Test spend caps and canonical-value reuse to prevent unnecessary AI searches.

**Exit gate:** A test customer can subscribe, use entitled features, cancel, export data, and receive support without manual database work.

### Week 8 — Release candidate
**September 14–20**

- Freeze launch scope.
- Run production acceptance on iPhone, Android, Safari, Chrome, and desktop.
- Rehearse deployment rollback, backup restoration, incident response, and support triage.
- Complete accessibility, performance, broken-link, empty-state, and copy review.
- Verify Cedriva’s visual and editorial treatment honors cigar history, makers, blenders, growers, retailers, lounges, writers, educators, and collectors.
- Obtain founder sign-off against the launch scorecard.

**Exit gate:** All Founder Beta gates pass for seven consecutive days with no severity-1 defect.

### Founder Beta
**September 21–October 18**

- Admit the first cohort gradually: 10 collectors, then 25 only after stability.
- Review support, error, cost, activation, retention, and trust metrics daily during week one and weekly thereafter.
- Update valuations when inventory is first ingested; schedule established records for monthly review.
- Build only repeated requests that improve trust or critical-path completion.
- Decide whether Google Places belongs in the public-launch scope by October 5.

**Exit gate:** Four stable weeks, successful paid usage, acceptable support load, and no unresolved critical trust defect.

### Public-launch preparation
**October 12–25**

- If Places is in scope, enable Google Places API and billing, add `GOOGLE_PLACES_API_KEY`, apply the Places migration, redeploy, and test ZIP search, attribution, rankings, cost controls, and monthly refresh.
- Verify launch copy, social previews, onboarding, pricing, support, monitoring, status communications, and rollback.
- Prepare a controlled announcement sequence rather than a single traffic spike.

### Conditional Public Launch
**October 26, 2026**

Launch publicly only if every hard gate below is green.

### Post-launch growth pilot — Cedriva Founding Lounge Program

After the canonical production app and lounge launch gates pass, Brian may authorize the controlled Founding Lounge Program described in Document 401.

- Begin with 8–12 lounges in one or two markets.
- Recruit through warm industry introductions and founder-led outreach before using paid acquisition.
- Give each lounge a venue-specific QR kit, a free 90-day pilot, public discovery visibility, and a private monthly insight report.
- Keep the guest rating flow under 30 seconds and limited to a small number of focused questions.
- Measure verified ratings per lounge, completion rate, returning Cedriva users, owner report engagement, renewals, and referrals.
- Keep basic listing and fair ranking free; never sell ranking position, review removal, or access to private collector data.
- Keep Cedriva ratings, Google ratings, certification, and commercial-partner status visibly separate.

Do not build a scaled owner dashboard or fund national promotion until the pilot proves sustained guest participation and owner value.

#### Required Founding Lounge decision checkpoint

This checkpoint is mandatory and moves with the public-launch date:

1. After Cedriva completes 14 consecutive stable public-launch days, place the Founding Lounge Program on the next Friday founder review.
2. Review the Document 401 launch gates, production stability, rating integrity, support load, and owner-material readiness.
3. Within 30 days of public launch, record one explicit decision: **authorize pilot**, **defer with a new review trigger**, or **do not proceed**.
4. If authorized, assign the pilot owner, first-market target, first 10 lounge prospects, and installation start date.

The checkpoint creates a required decision; it does not automatically authorize owner outreach or launch.

## Hard launch gates

| Gate | Founder Beta | Public Launch |
|---|---:|---:|
| Build, typecheck, and automated tests pass | Required | Required |
| Severity-1 defects open | 0 | 0 |
| Severity-2 defects open on critical path | 0 | 0 |
| Private candidate containment and participant-disclosure approval | Required before any candidate-visible cohort | Required until dated adoption |
| Replacement-brand linguistic, trademark, common-law, registry, digital, residual-risk, and dated adoption gates | May remain pending only if the beta presentation is brand-neutral or separately authorized as confidential candidate disclosure | Pass |
| Cross-device inventory synchronization | Pass | Pass |
| Photo intake and edit completion | Pass | Pass |
| Authentication and recovery | Pass | Pass |
| Tenant isolation and administrative authorization | Pass | Pass |
| Collection truth audit | Known founder records | Launch catalog |
| Defensible valuation coverage | ≥90% founder value | ≥95% active user value or labeled gaps |
| CSV and PDF exports | Pass | Pass |
| Backup restore rehearsal | Pass | Pass |
| Legal/privacy/support readiness | Drafted | Published and tested |
| Paid billing | Test mode may be acceptable | Live and reconciled |
| Critical mobile workflows | Pass | Pass |
| Seven stable production days | Required | Required |

## Weekly operating rhythm

- **Monday:** choose the week’s gate and freeze the work list.
- **Tuesday–Wednesday:** implement and test.
- **Thursday:** production-like acceptance and data audit.
- **Friday:** founder review, defect triage, metrics, and go/no-go for the next gate.
- **Daily:** ship only reviewed changes; automatically commit and push completed, tested work.

## Measures that matter

- Critical-path completion rate
- Inventory synchronization error rate
- Photo identification success and correction rate
- Import acceptance and rollback rate
- Valuation coverage and evidence confidence
- Collection component accuracy
- Cigar Somm exact-identity and pairing completion rate
- Password-recovery completion rate
- Report/export success rate
- Weekly active collectors and four-week retention
- Support requests per active collector
- AI and third-party cost per active collector
- Corrections contributed and verified by the community

## Immediate next actions

1. Complete the Phase 0 baseline and produce the single launch-defect register.
2. Treat data synchronization, photo completion, collection truth, and valuation coverage as the first engineering sequence.
3. Keep Google Places disabled until the October 5 scope decision unless earlier beta evidence makes it essential.
4. Configure Stripe only after core workflows pass the Week 5 gate.
5. Reforecast every Friday. Move dates when a hard gate fails; never redefine “done.”

## Revision history

| Version | Date | Author | Change |
|---:|---|---|---|
| 1.4 | July 30, 2026 | Brian Bowers / Codex | Added the controlling replacement-brand clearance and confidential-disclosure gates and recorded the current launch decision as HOLD until every active product and brand gate passes. |
| 1.3 | July 26, 2026 | Brian Bowers / Codex | Recorded the retired Cedriva terminology and made the launch gates independent of an unapproved replacement name. |
| 1.2 | July 26, 2026 | Brian Bowers / Codex | Added a mandatory, event-based Founding Lounge decision checkpoint after two stable public-launch weeks and within 30 days of launch. |
| 1.1 | July 26, 2026 | Brian Bowers / Codex | Added the gated post-launch Founding Lounge Program and linked its pilot, trust, and commercial boundaries to Document 401. |
| 1.0 | July 24, 2026 | Brian Bowers / Codex | Replaced the MVP outline with a gated Founder Beta and conditional public-launch operating schedule. |
| 0.1 | July 23, 2026 | Brian Bowers | Established the initial 30-day founder sequence. |
