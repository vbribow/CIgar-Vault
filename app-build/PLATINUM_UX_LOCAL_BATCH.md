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

## Validation already completed

- Focused quality checks: 10 of 10 passed.
- Type checking: passed.
- Production build: passed.
- Full regression suite: still required immediately before release because the prior run was blocked by the workspace credit limit.

## Larger-batch release checklist

Before these changes go live:

1. Reconcile the prepared work with the latest approved main branch.
2. Combine it with the larger approved update list.
3. Run the complete regression suite and a fresh production build.
4. Confirm the site remains owner-only and no partner activity is launched.
5. Obtain Brian's explicit approval before committing, pushing, or privately deploying the combined release.

No item in this section has been pushed or deployed.
