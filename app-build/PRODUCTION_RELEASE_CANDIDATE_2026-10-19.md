# Hojavía Production Release Candidate — October 19, 2026

**Decision:** `HOLD — FROZEN FOR HUMAN ACCEPTANCE`  
**Private app:** `https://app.hojavia.com`  
**Source:** `e82bd3049bfed3840207274753aa3d5df1c3c758`  
**App artifact:** `hojavia-beta-shell-v4-c1704144324d`  
**Candidate fingerprint:** `7fecc5437937df1f83339501fa5e58079b89690ff45fa7f264dbcac24a29bd66`

## Preserved evidence

- GitHub Actions run `39304192382` completed successfully: 1,197 tests passed, TypeScript passed, and the production build passed.
- Vercel reported the production deployment Ready.
- `https://app.hojavia.com/api/health` returned connected and healthy during release acceptance.
- The signed-in production Sensors page completed its server render and showed five of five SensorPush devices current.
- The owner-scoped recent-history index was applied successfully in production and is preserved as migration `202610190001_vault_records_recent_history_index.sql`.
- The earlier full-history Sensors timeout is not counted as a passing observation. The corrected candidate received a new fingerprint.

## Why the stability window remains 0/7

The artifact is now identifiable and deployed, but a production day is not inferred from automation alone. Day one requires the candidate's real-account authentication and tenant-isolation worksheet plus the required physical-device checks to pass. `data/launch-stability.ts` therefore records the candidate but no observations.

## Required next evidence

1. Complete `AUTH_RECOVERY_ISOLATION_ACCEPTANCE_2026-10-07.md` with two approved test identities.
2. Complete the iPhone and Android critical checks in `FOUNDER_REAL_DEVICE_ACCEPTANCE_2026-10-07.md`.
3. If both pass without a Severity 1 or critical-path Severity 2 defect, add one dated observation for October 19 or the actual acceptance date—never backdate it.
4. Preserve one qualifying observation on each of six following consecutive calendar days.

Additional beta-tester recruitment is not part of this path. Brian ended further recruitment on October 19; acceptance uses controlled test identities and a designated physical-device operator without widening access.

## Invalidation rules

Invalidate and replace the fingerprint for any application-code change or any fix to authentication, account isolation, durable saves, recovery, or a critical device journey. Documentation-only evidence recording does not create a new application artifact. Any cross-account disclosure, authentication bypass, data loss, silent stale overwrite, destructive restore, duplicate durable write, or unavailable critical journey keeps launch on `HOLD` and restarts the window after correction.
