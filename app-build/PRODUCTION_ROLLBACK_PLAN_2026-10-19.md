# Hojavía production rollback plan

**Current known-good source:** `e82bd3049bfed3840207274753aa3d5df1c3c758`

**Current known-good application artifact:** `hojavia-beta-shell-v4-c1704144324d`

## Before deployment

1. Record the exact candidate commit, Vercel deployment URL, production alias, migration list, and release fingerprint.
2. Run `pnpm preflight:release` once. Do not deploy if any step fails.
3. Confirm that every database change is additive or has a separately reviewed recovery plan.
4. Keep `app.hojavia.com` on the current production deployment until the candidate is Ready.

## Rollback trigger

Rollback immediately for account crossover, failed authentication or recovery, inability to save inventory or smoke records, corrupt quantities, repeated server timeouts, or an unusable installed app. A cosmetic defect may be evaluated without immediate rollback.

## Application rollback

1. In Vercel, promote the known-good deployment for source `e82bd3049bfed3840207274753aa3d5df1c3c758` back to `app.hojavia.com`.
2. Verify `/api/health`, login, one inventory read, one smoke-journal read, and the Sensors dashboard.
3. Reopen the installed PWA and confirm that it has returned to the known-good release.
4. Record the incident, failed candidate, rollback time, and verification result.

## Database boundary

Application rollback does not reverse a Supabase migration. Never run destructive rollback SQL from this checklist. If a candidate includes a database migration, preserve compatible application behavior or use a separately reviewed forward repair.

## Local rehearsal

`pnpm rehearse:rollback` validates a copied build artifact in temporary storage. It never changes Vercel, Supabase, production data, or DNS.
