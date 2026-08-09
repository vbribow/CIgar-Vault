# Supabase migration-history reconciliation

Status: required before the next schema release

Scope: private Hojavía collector application

Current hold: production has no Supabase migration ledger. A reviewed baseline is required before any future schema release.

Latest read-only audit: August 7, 2026. The authenticated production dashboard reported no tracked migrations, and a read-only SQL query confirmed `supabase_migrations.schema_migrations` does not exist. Schema-level queries confirmed both formerly colliding changes are deployed: all eight partner-platform tables exist, and both community status constraints allow `active`, `review`, `changes`, and `hidden`. Git history establishes that the partner migration was created first. The partner file therefore retains `202607240001`; the later community constraint migration is now `202608070001_community_contribution_status.sql`. No production schema, data, or migration history was changed.

This procedure protects existing collector data. It does not authorize a database change, deployment, or public release.

## Reconciled local files

- `202607240001_partner_platform.sql`
- `202608070001_community_contribution_status.sql`

The local manifest must continue to use unique versions. Do not apply migrations or create migration-history rows until the complete production schema has been compared with all 32 local files and the baseline transaction below is approved.

## Phase 1 — read-only evidence

1. Confirm the intended Supabase project before opening its SQL editor or CLI connection. Record the project name and project reference; never infer them from a browser tab.
2. Query `supabase_migrations.schema_migrations`. If the relation does not exist, record that result rather than creating it during evidence collection.
3. Compare every local migration's resulting tables, columns, constraints, indexes, functions, triggers, and policies with production. Preserve the read-only result outside the deploy artifact with the UTC capture time and project reference.
4. Run the local audit from `app-build`:

   ```sh
   pnpm audit:migrations
   ```

   The local audit must report `pass`, but that result does not prove production has a migration baseline.
5. Produce a baseline manifest that marks only schema effects proven present. Missing or materially different effects must remain pending migrations; do not mark them applied.

Stop if the remote ledger is unavailable, incomplete, connected to the wrong project, or does not identify the applied statements strongly enough.

## Phase 2 — written decision

The schema-level decision is recorded above: both effects are present, Git history fixes their dependency order, and the local versions are now unique. The remaining decision is the production baseline method. Prefer the supported Supabase CLI migration-repair workflow after the full schema comparison; do not hand-create internal tables or insert guessed statements.

## Phase 3 — protected change window

Before any ledger repair or migration application:

1. Create and verify a current database backup or provider recovery point.
2. Freeze the exact application artifact and migration manifest being reviewed.
3. Confirm the private beta invitation hold and affected scheduled jobs.
4. Obtain Brian's explicit approval for the exact baseline versions and database operation.
5. Apply only the approved baseline repair and genuinely pending migrations—never an inferred repair.

If a migration-history repair command is required, capture its proposed target and direction before execution. Treat the repair as a database mutation even when it changes only the migration ledger.

## Phase 4 — acceptance evidence

After an approved database change:

- Re-export the remote migration ledger and confirm every version is unique.
- Re-run the migration audit; it must report no collision.
- Verify the account-preference, smoking-log, Collector 25 contribution, partner, and retailer paths with a founder-controlled or synthetic account.
- Confirm opt-out withdrawal, retry safety, ownership boundaries, and no unexpected record-count changes.
- Run type checking, the complete automated suite, internal-navigation audit, and one production build.
- Record the artifact release, migration manifest hash, backup reference, operator, UTC timestamps, and acceptance result.

Rollback or hold immediately if the remote ledger differs from the approved decision, any migration is partially applied, collector ownership cannot be proven, or verification produces a destructive or unexplained data change.
