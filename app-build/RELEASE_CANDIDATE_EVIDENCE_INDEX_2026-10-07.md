# Hojavía Release-Candidate Evidence Index

**Prepared:** October 7, 2026  
**Current decision:** HOLD  
**Candidate surface:** private installable PWA at `https://app.hojavia.com`

This index points to evidence rather than duplicating it. A local pass does not substitute for production, real-device, legal, or founder acceptance.

| Gate | Authoritative evidence | Executable proof | Human/production acceptance | Status and required artifact |
| --- | --- | --- | --- | --- |
| Release identity and gates | `lib/launch-readiness.ts`; `PROJECT_BRIEF.md` | `tests/launch-readiness.test.ts` | Founder reviews the dated register | HOLD; owner, evidence date, next action, and founder decision |
| Authentication and isolation | `AUTH_RECOVERY_ISOLATION_ACCEPTANCE_2026-10-07.md`; auth navigation/email-link helpers; Supabase server helpers | `tests/auth-*.test.ts`, `tests/recovery-flow.test.ts`, account/recovery route tests | Run the document's ten-step clean-browser and second-account script | Open; dated account-flow worksheet without private screenshots |
| Save and cross-device integrity | `CORE_MUTATION_INTEGRITY_2026-10-07.md`; mutation routes and revision helpers | inventory sync/save, collection save, valuation write, smoking persistence, and photo tests | Run the document's two-device disposable-lot conflict check | Open; before/after IDs, revisions, quantities, and result |
| Import/export/recovery | `IMPORT_EXPORT_RECOVERY_SAFETY_2026-10-07.md`; import/recovery helpers and routes | import, export, recovery, rollback, and owner-isolation tests | Preview, commit, repeat import, export, restore, and hosted large-export check | Open; synthetic fixture and recovery report |
| Sensors | `/api/sensor-sync`, sensor dashboard, system health, humidor insights | SensorPush, system-health, and long-history tests | Seven consecutive current production days | Open; timestamps and five-device dashboard evidence |
| Photo intake | photo intake, storage, reconciliation, and manager modules | photo intake/storage/navigation/retry tests | Physical phone capture, correction, save, reopen, and retry | Open; saved record ID and non-sensitive screenshots |
| Places | Places API routes and cost controls | Places search/rating/refresh tests | Founder scope decision plus ZIP/city, radius, lounge-only, attribution, rating, limits, monthly refresh | Open; signed scope decision and acceptance sheet |
| Device/accessibility | mobile reliability audit and device matrix | `node scripts/audit-mobile-reliability.mjs` | iPhone Safari/PWA, Android Chrome/PWA, keyboard, VoiceOver, approved Android reader | Open; founder acceptance packet |
| Legal/privacy/support | privacy, terms, trust, incident and correction routes; public go/no-go form | Route/build audits only | Qualified review, named support/incident owners, deletion rehearsal, founder decision | Open; dated approvals and ownership record |
| Billing | checkout, webhook, portal, entitlement code | billing and entitlement tests | Separately authorized Stripe test-mode runbook | Open before paid launch; no live charge |
| Paid research | research readiness, ledger, cache, budget controls | research service and route tests | Separate budget/key/migration/controlled-query approval | Not started; remains disabled |
| Public website | separate `hojavia-website` records and founder go/no-go form | Separate website build/test suite | Legal, accessibility, hosting, support, route, and founder approval | No-go; immutable site artifact and rollback artifact |

## Focused validation commands

Run only the command relevant to changed files during Tasks 03–05:

```sh
cd app-build
tsx --test tests/auth-*.test.ts tests/recovery-flow.test.ts tests/account-recovery*.test.ts
tsx --test tests/inventory-*.test.ts tests/collection-*.test.ts tests/valuation-*.test.ts tests/smoking-*.test.ts tests/photo-*.test.ts
tsx --test tests/import-safety.test.ts tests/inventory-import.test.ts tests/private-record-export.test.ts tests/vault-recovery-safety.test.ts tests/account-recovery*.test.ts
tsc --noEmit
```

## One final local validation suite

Run once after the milestone is complete:

```sh
cd app-build
tsc --noEmit
tsx --test tests/*.test.ts
node scripts/audit-internal-links.mjs
node scripts/audit-launch-journeys.mjs
node scripts/audit-mobile-reliability.mjs
node scripts/audit-performance-budget.mjs
node scripts/build-app.mjs
```

Then record the source commit, installed-app artifact stamp, exact results, known limitations, open human/production gates, and rollback trigger. Production credentials, production mutations, deployment, public access, billing, paid research, affiliate work, marketplace work, and partner outreach are outside this index and require separate approval.
