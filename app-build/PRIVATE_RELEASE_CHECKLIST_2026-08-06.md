# Private release value checklist

Decision: **PRIVATE CODE DEPLOYED; DATABASE RELEASE HOLD**

This checklist separates the approved code-only private preview update from database and brand-dependent work. It does not authorize migration, public access, partner activity, or a trademark decision.

## 1. Code-ready evidence

- Local TypeScript, automated tests, internal navigation, and the production build must all pass on one unchanged candidate.
- The local Vault manager declares and uses its cigar-only `scopedItems` set.
- The local Records manager declares and uses `valuationSource` for valuation actions.
- Collector 25 synthetic coverage proves exact identity, one latest contribution per collector and cigar, anonymous numeric-only sharing, opt-in behavior, and non-blocking failure.
- Certified-retailer synthetic coverage proves verified-purchase ownership, reviewer balancing, evidence dimensions, exact HTTPS cigar matching, and non-readable order references.

## 2. Current private-preview acceptance

Private Sites version 59 was deployed successfully on August 7, 2026 from packaging commit `58ccd4534a175967f2f9c3b6deae48905381ffa6`, whose root tree is the validated `app-build` tree from source commit `398436f56d8c079f053f2d14065fde9a7e7e2552`. No database migration or access change was included.

Read-only phone-size inspection at 390 × 844 CSS pixels found:

- Home: pass. Five-item mobile navigation is visible and the page has no horizontal overflow.
- Signup: pass for presentation. The create-account path has no unlabeled visible controls and no horizontal overflow; no account was submitted.
- More menu: pass. It opens as a labeled dialog, exposes search and the collector workspace directory, provides a labeled close control, and has no horizontal overflow.
- Vault/document cigar: pass on version 59. `/inventory#mobile-intake` renders the complete collection workspace with no client error or console warning.
- Log a Smoke: pass on version 59. `/records#log-smoke` renders the complete tasting-journal form with no client error or console warning.
- Recovery: presentation boundary pass. `/account#recovery-point` redirects an unauthenticated session to sign-in as expected; no credential or account mutation was authorized.
- Installed-app update: no service-worker update failure appeared during the version 59 route checks. The installed-app update interaction itself remains a later controlled-device check.

The two undefined-variable failures are fixed in the deployed artifact and protected by `tests/private-preview-runtime-regressions.test.ts`. Database reconciliation is still required before any schema migration is considered.

## 3. Database-ready evidence

- The local migration audit now has unique versions. Production still has no Supabase migration ledger, so a backed-up, explicitly approved baseline transaction remains required before any schema release.
- A read-only request to the configured project confirmed that PostgREST exposes only `public` and `graphql_public`; the internal `supabase_migrations` ledger is not available through that route (`PGRST106`).
- Obtain the ledger through an authenticated Supabase dashboard or CLI session and complete `MIGRATION_RECONCILIATION_RUNBOOK.md`.
- Do not rename a migration, repair the remote ledger, or apply schema changes until the exact remote statements identify the applied file and Brian separately approves the database operation.

## 4. Trademark-dependent work

- Keep Hojavía private and reversible until the founder records the intended legal owner, filing scope, residual-risk acceptance, and dated adoption decision.
- Do not widen indexing, adopt a production domain, publish launch materials, claim handles, or start partner campaigns as part of a private application update.
- Fox Cigars remains outside this release and requires separate explicit approval for any campaign, tracking, outreach, or live integration.

## 5. Remaining release gates

1. Reconcile the database ledger in a later, separately approved change window.
2. Run signed-in backup and recovery checks with a controlled test account without touching founder data.
3. Complete installed-app update checks on a physical phone and a second-device session.
4. Enter or import exact founder cigar records only in an explicitly approved data session.
5. Record the founder's trademark adoption decision before public launch, indexing, or production-domain work.
6. **Paid research activation reminder:** after the production migration baseline is reconciled, create and fund a dedicated OpenAI Platform project, set founder-approved hard spending limits and alerts, apply `202608090001_cigar_research_service.sql`, add `OPENAI_API_KEY` and `OPENAI_RESEARCH_MODEL` through the protected environment-secret interface, set `OPENAI_RESEARCH_ENABLED=true`, redeploy, and pass the controlled founder research evaluation. Until every step passes, live research must remain visibly unavailable and make no paid request.
