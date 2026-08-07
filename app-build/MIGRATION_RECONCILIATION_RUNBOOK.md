# Supabase migration-history reconciliation

Status: required before the next schema release

Scope: private Hojavía collector application

Current hold: two local files share version `202607240001`

Latest read-only audit: August 6, 2026. The local manifest contains 32 migrations, no direct destructive DDL, duplicate version `202607240001`, and manifest SHA-256 `d1c7232860d3059dfd19258523dc5b46f88822e1ed58bcc47847c3d73fe729ff`. The audit did not connect to a database. No production project reference, remote ledger, or safe CLI connection was available in the workspace, so Phase 1 remains blocked at step 1 and no filename or database history was changed.

This procedure protects existing collector data. It does not authorize a database change, deployment, or public release.

## Files in collision

- `202607240001_community_contribution_status.sql`
- `202607240001_partner_platform.sql`

Do not rename, repair, or apply either file until the remote migration ledger has been captured and compared with the exact SQL already applied to the production project.

## Phase 1 — read-only evidence

1. Confirm the intended Supabase project before opening its SQL editor or CLI connection. Record the project name and project reference; never infer them from a browser tab.
2. Export the complete remote migration ledger from `supabase_migrations.schema_migrations`, ordered by version. Preserve every available column, including the applied statements when present.
3. Save the export outside the deploy artifact with the UTC capture time and project reference.
4. Run the local audit from `app-build`:

   ```sh
   pnpm audit:migrations
   ```

   The expected result remains `review_required` while the collision exists.
5. Compare remote version `202607240001` with both local files by exact statements and resulting schema objects. A matching timestamp alone is not evidence that a particular file was applied.

Stop if the remote ledger is unavailable, incomplete, connected to the wrong project, or does not identify the applied statements strongly enough.

## Phase 2 — written decision

Record one of these outcomes before editing a filename:

- Community migration matches remote: preserve its version; assign the partner migration a new unused version.
- Partner migration matches remote: preserve its version; assign the community migration a new unused version.
- Neither migration is present remotely: assign distinct unused versions according to their dependency order.
- Both effects appear remotely or history is ambiguous: hold the release and perform a schema-level reconciliation. Do not guess and do not rewrite the ledger merely to make tooling green.

Any new version must be later than every version already used locally or remotely at the time of the decision. Update tests and operational records in the same reviewed change.

## Phase 3 — protected change window

Before any ledger repair or migration application:

1. Create and verify a current database backup or provider recovery point.
2. Freeze the exact application artifact and migration manifest being reviewed.
3. Confirm the private beta invitation hold and affected scheduled jobs.
4. Obtain Brian's explicit approval for the database operation.
5. Apply only the approved reconciliation and pending migrations—never an inferred repair.

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
