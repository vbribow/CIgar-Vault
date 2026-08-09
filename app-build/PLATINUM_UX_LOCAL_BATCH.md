# Platinum UX local batch

## Purpose

This batch improves the private collector application without publishing a new version or using paid services. It focuses on predictable navigation, plain collector-facing language, and durable mobile and keyboard standards.

## Navigation policy

- Read-only education, reference, catalog, collection, and industry journeys remain in the current tab so the browser Back button returns naturally to Hojavía.
- Official Habanos verification journeys also remain in the current tab and explain how to return.
- A separate tab remains appropriate only for active forms or workspaces where leaving could discard unfinished work.

## Language improvements

- Evidence conclusions now explain what the records support.
- Synthetic walkthroughs state clearly that nothing is saved or submitted.
- Collector screens use familiar phrases such as “trusted record,” “complete collection,” and “saved review queue.”
- Internal operating language such as “canonical,” “authoritative inventory,” and “durable queue” was removed from the affected customer-facing messages.

## Platinum safeguards

Automated checks now protect:

- single-tab behavior across the selected read-only journeys;
- plain-language wording on high-value collector screens;
- minimum mobile tap-target and form-control sizes;
- visible keyboard focus;
- stable walkthrough heading positioning.

## Release status

The changes are local and validated only. Deployment is intentionally deferred so they can be included in the next approved private release batch.

## Pending mobile and first-session improvements

The following completed work must be included in the larger release batch:

- Correct the guided-checklist smoking link so it opens the collector's smoking-record workflow.
- Show returning private collectors their dashboard before introductory education on the home screen.
- Use the private-collector actions “Open my Vault” and “Continue setup” in the home-page introduction.
- Add a visible completion percentage and accessible progress indicator to the account checklist.
- Place the guided checklist before the profile form on mobile screens.
- Keep backup restoration available while placing its advanced controls inside “Restore from an existing backup.”
- Add automated coverage for the mobile first-session experience.
- Present an empty vault as ready to begin—not as 0% complete—and avoid falsely marking empty audit categories complete.
- Expose collection-completeness progress to screen readers.
- Make Vault recovery show exact record impact, distinguish same-account and different-account exports, and require intention-specific confirmation before replacing conflicts.
- Explain which account data is recoverable, which settings remain reference-only, and which unfinished work stays on the original device.
- Keep password-reset and import controls recoverable after network or response failures, with accessible status messaging.

## Queued live-research foundation

Include the completed no-billing `Research any cigar` foundation in the next
approved private code-release batch. The batch includes the authenticated API
route, exact-identity normalization, per-user quotas, request idempotency,
source-backed cache and provenance controls, usage/error ledgers, provider
failure handling, disabled-state interface, configuration template, automated
coverage, launch-readiness gate, and activation runbook.

The release must leave the feature visibly unavailable and fail closed. It must
not apply `supabase/migrations/202608090001_cigar_research_service.sql`, add an
API credential, create or fund a provider project, enable
`OPENAI_RESEARCH_ENABLED`, run a paid query, widen access, or change the public
website. Those actions remain a later, separately approved activation change
after database reconciliation and billing controls are complete. The exact
scope and acceptance checks are recorded in
`NEXT_PRIVATE_RELEASE_BATCH_2026-08-09.md`.

## Validation already completed

- Focused quality checks: 10 of 10 passed.
- Collection-health quality checks: 4 of 4 passed.
- Recovery-safety focused checks: 20 of 20 passed.
- Complete application test suite: 810 of 810 passed.
- Type checking: passed.
- Production build: passed.
- Internal navigation audit: 165 routes passed.
- A fresh complete regression run remains required immediately before the eventual combined release if relevant application files change again.

## Larger-batch release checklist

Before these changes go live:

1. Reconcile the prepared work with the latest approved main branch.
2. Combine it with the larger approved update list.
3. Run the complete regression suite and a fresh production build.
4. Confirm the site remains owner-only and no partner activity is launched.
5. Obtain Brian's explicit approval before committing, pushing, or privately deploying the combined release.

No item in this section has been pushed or deployed.
