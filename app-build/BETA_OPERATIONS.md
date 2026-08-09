# Private Beta Operations

Version: 1.3
Updated: July 30, 2026
Owner: Brian Bowers

Cedriva is retired as a brand and remains only in unchanged legacy technical
surfaces. These procedures govern the platform independently of the eventual
cleared and explicitly adopted replacement name.

## Purpose

Operate a controlled cohort of up to 10 trusted collectors without treating the beta as a public launch. The cap does not authorize invitations: each participant still requires Brian's approval and every invitation gate must pass.

## Launch controls

- Set `BETA_INVITE_ONLY=true` in the production environment.
- Complete `MIGRATION_RECONCILIATION_RUNBOOK.md` before any schema release. The local filename collision is resolved, but production has no Supabase migration ledger and must receive a reviewed, backed-up baseline before future migrations.
- Apply `202607240008_beta_readiness.sql` before inviting anyone.
- Add a collector in `/founder-onboarding` as a Prospect.
- Move the collector to Invited only after Brian approves that person.
- Preparing an email opens the founder's email client. The platform never sends an invitation automatically.
- The invited collector must use the exact invited email address.
- Signup requires legal-age confirmation and acceptance of the Privacy Notice, Terms, and Beta Agreement.

## Invitation gate

Open `/founder-onboarding`, enter the Founder key, and confirm all six safeguards pass:

1. Invitation-only enrollment is enabled.
2. Founder administration credentials are available.
3. Consent and feedback migrations are active.
4. Every signed-up tester has a recorded consent.
5. Every signed-up tester has established an inventory backup.
6. No unresolved blocking feedback remains.

Do not invite the cohort while the dashboard says to hold.

## Go-live blockers

The following items must be completed and tested before the Places or Lounge
Passport programs are presented as production-ready:

1. Use one canonical production app so portfolio, inventory, authentication, and lounge activity do not split across separate installations.
2. Configure Google Places access in the production environment and confirm ZIP-code lounge discovery works on a signed-in phone.
3. Connect lounge ratings to approved production storage and verify that ratings survive sign-out, restart, and installation from the home screen.
4. Test one lounge-specific QR code from scan through successful rating, duplicate protection, moderation, and ranking display.
5. Confirm community ratings, Google ratings, and any independent platform certification remain visibly separate.

Do not launch the lounge partner program while any item above is incomplete.

## First-session checklist

1. Confirm the tester's email.
2. Complete account and collection onboarding.
3. Add or import a small, recognizable subset of the tester's real collection.
4. Create an inventory backup from the Integrity Center.
5. Confirm the downloaded complete-vault export opens as valid JSON.
6. Ask the tester to submit a sample report through `/feedback`.
7. Confirm the report appears in the Founder beta issue desk.

## Incident and rollback procedure

Use `corporate-docs/INCIDENT_RESPONSE_AND_LAUNCH_HOLD_RUNBOOK.md` as the
controlling internal procedure.

1. Stop new invitations and affected launch activity for every Severity 1 or
   critical-path Severity 2 incident.
2. Open `/launch-readiness`, classify the incident, and review the prefilled
   private incident record before submitting it.
3. Preserve the affected user's complete export, recovery point, record IDs,
   timestamps, screenshots, and relevant logs without copying unrelated private
   collection details.
4. Contain the affected access, automation, deployment, or feature. Do not
   delete evidence.
5. Revert to the last known-good deployment when rollback is safer than a
   forward correction.
6. Prove restoration and correction with a founder-controlled or synthetic
   account before asking a collector to restore.
7. Add exact regression coverage, reconcile affected records and totals, and
   document the root cause and residual risk.
8. Resume invitations or affected launch activity only after every impacted
   gate is reassessed and the accountable owner explicitly approves reopening.

## Non-negotiable exclusions

- No public launch is authorized by this beta.
- No tobacco marketplace, brokerage, sales, or compensated transaction workflow is authorized.
- No Fox Cigar test, trial, tracking link, campaign, communication, or live integration may launch without Brian Bowers's specific approval.
- Private collection records are never supplied to manufacturers, retailers, lounges, partners, or other collectors.
