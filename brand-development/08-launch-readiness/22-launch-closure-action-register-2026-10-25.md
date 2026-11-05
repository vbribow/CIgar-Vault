# Hojavía Launch-Closure Action Register

**Candidate:** `8ad45d89805b0bdbe7acb51ff31b2d8c56fbd6a6`  
**Status:** Candidate unchanged; seven-day stability gate PASS
**Rule:** Evidence collection only—no application changes during the window

## Remaining actions before final GO

| Priority | Action | Owner | Due | Status |
|---:|---|---|---|---|
| 1 | Record seven consecutive qualifying days against the unchanged candidate | Brian / Engineering | Oct 29–Nov 4 | PASS · 7 of 7 completed November 4 |
| 2 | Run current physical Android essential journey | Brian or controlled Android tester | Before final GO | Open |
| 3 | Exercise account deletion and verify clear confirmation/recovery boundary | Brian / Engineering | Before final GO | Open |
| 4 | Exercise session expiry without exposing another account's data | Brian / Engineering | Before final GO | Open |
| 5 | Verify photo capture and two-photo smoke journal on a physical phone | Brian | During stability window | PASS · founder reported October 30 |
| 6 | Verify export and non-destructive import-recovery preview | Brian / Engineering | During stability window | PASS · founder reported October 29 |
| 7 | Perform keyboard and named-screen-reader spot check | Human reviewer | Before final GO | Open |
| 8 | Confirm one published support route and name the incident owner | Brian | Before access widens | Open |
| 9 | Confirm terms, privacy, deletion, and data-use language | Brian / qualified reviewer | Before access widens | Open |
| 10 | Pricing set: 30-day full access, then limited Free / Collector $12 monthly or $129 yearly / Pro $25 monthly or $269 yearly; complete Stripe test-mode Checkout, portal, webhook, lifecycle, receipt, cancellation, recovery, and entitlement acceptance while keeping live charging disabled | Brian / Engineering | Before billing activation | Test-mode completion approved November 4; live activation requires separate approval |
| 11 | Record rollback owner, trigger, and incident contact | Brian | Before final GO | Open |

## Already closed

- Progressive web app launch path; native stores deferred.
- No additional beta cohort.
- Frozen candidate identity and Day 1 evidence.
- Founder iPhone journey and Tony Newport account-isolation check.
- Cigar Somm, Hojavía 25, SensorPush, and Google Places founder checks.
- No reported Sev-1 or unresolved critical Sev-2 at freeze.
- Seven consecutive qualifying stability days completed on the unchanged
  candidate through November 4.

## Scope discipline

Do not turn an open human check into feature development during the stability
window. A failed check may justify a launch-defect correction, but any deployed
candidate change requires a new fingerprint and restarts Day 1.
