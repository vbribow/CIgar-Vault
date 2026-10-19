# Migration-ledger reconciliation

The repository contains 39 authoritative ordered migration files with local manifest SHA-256 `ce5401c201463106e579ef61e0f06b7a260d607334cc86d9deaff1cb121999b9`. Production ledger parity is still unproven because only migration `202610190001` has been directly verified during this release cycle.

On October 19, a read-only production query confirmed that `supabase_migrations.schema_migrations` does not exist. The only migration-named tables belong to Supabase-managed `auth`, `realtime`, and `storage` schemas; none is an application migration ledger. Therefore Hojavía must not claim full historical parity from the current database.

Run `pnpm reconcile:migrations -- --production-ledger=/absolute/path/to/versions.txt` after exporting only the Supabase migration version column, one version per line. The command compares identifiers and local file hashes, prints no credentials, makes no network request, and never changes the database.

A `pass` means every production version has one corresponding local migration and every local migration appears in production. A `hold` means the ledger was not supplied or a difference exists. Differences require review; they are not permission to apply migrations automatically.

For this release, retain the database gate at `Hold` while treating the separately verified additive index migration as applied. Establish an application-owned ledger during a separately approved database-maintenance window; do not create or backfill it as part of an application deployment.
