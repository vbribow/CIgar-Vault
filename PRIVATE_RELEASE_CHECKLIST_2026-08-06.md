# Private release value checklist

Decision: **HOLD**

This checklist separates a code-only private preview update from database and brand-dependent work. It does not authorize deployment, migration, public access, partner activity, or a trademark decision.

## 1. Code-ready evidence

- Local TypeScript, automated tests, internal navigation, and the production build must all pass on one unchanged candidate.
- The local Vault manager declares and uses its cigar-only `scopedItems` set.
- The local Records manager declares and uses `valuationSource` for valuation actions.
- Collector 25 synthetic coverage proves exact identity, one latest contribution per collector and cigar, anonymous numeric-only sharing, opt-in behavior, and non-blocking failure.
- Certified-retailer synthetic coverage proves verified-purchase ownership, reviewer balancing, evidence dimensions, exact HTTPS cigar matching, and non-readable order references.

## 2. Current private-preview acceptance

Read-only phone-size inspection at 390 × 844 CSS pixels found:

- Home: pass. Five-item mobile navigation is visible and the page has no horizontal overflow.
- Signup: pass for presentation. The create-account path has no unlabeled visible controls and no horizontal overflow; no account was submitted.
- More menu: pass. It opens as a labeled dialog, exposes search and the collector workspace directory, provides a labeled close control, and has no horizontal overflow.
- Vault/document cigar: fail on the currently deployed artifact. The interruption boundary catches a client failure; the deployed bundle reports `scopedItems is not defined`.
- Log a Smoke: fail on the currently deployed artifact. The deployed bundle reports `valuationSource is not defined`.
- Recovery: not run. The available browser session redirected to sign-in, and no credential or account mutation was authorized.
- Installed-app update: hold. Repeated service-worker update failures were present in the browser log and require confirmation after a private code update.

The two undefined-variable failures are fixed in local source and protected by `tests/private-preview-runtime-regressions.test.ts`. A future private code deployment must confirm the new artifact reaches Vault and Log a Smoke before any database migration is considered.

## 3. Database-ready evidence

- The local migration audit remains `review_required` because two files share version `202607240001`.
- A read-only request to the configured project confirmed that PostgREST exposes only `public` and `graphql_public`; the internal `supabase_migrations` ledger is not available through that route (`PGRST106`).
- Obtain the ledger through an authenticated Supabase dashboard or CLI session and complete `MIGRATION_RECONCILIATION_RUNBOOK.md`.
- Do not rename a migration, repair the remote ledger, or apply schema changes until the exact remote statements identify the applied file and Brian separately approves the database operation.

## 4. Trademark-dependent work

- Keep Hojavía private and reversible until the founder records the intended legal owner, filing scope, residual-risk acceptance, and dated adoption decision.
- Do not widen indexing, adopt a production domain, publish launch materials, claim handles, or start partner campaigns as part of a private application update.
- Fox Cigars remains outside this release and requires separate explicit approval for any campaign, tracking, outreach, or live integration.

## 5. Smallest safe next release

1. Freeze one locally validated code artifact.
2. Deploy it privately without database migrations or access changes only after explicit deployment approval.
3. Re-test Home, Signup, More, Vault, Log a Smoke, Account recovery, and service-worker update on the deployed artifact.
4. Keep the release on hold if either undefined-variable error, an update-loop error, authentication uncertainty, or any partial-data state appears.
5. Reconcile the database ledger in a later separately approved change window.
