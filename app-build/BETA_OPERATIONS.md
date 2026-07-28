# Private Beta Operations

Version: 1.2
Updated: July 26, 2026
Owner: Brian Bowers

Cedriva is retired as a brand and remains only in unchanged legacy technical
surfaces. These procedures govern the platform independently of the eventual
cleared and explicitly adopted replacement name.

## Purpose

Operate a controlled cohort of four to five trusted collectors without treating the beta as a public launch.

## Launch controls

- Set `BETA_INVITE_ONLY=true` in the production environment.
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

1. Stop new invitations.
2. Record the issue as Blocking in the beta feedback channel.
3. Preserve the affected user's export and relevant timestamps.
4. Revert the application to the last known-good deployment when the issue risks data, privacy, authentication, or trust.
5. Test restoration using a founder-owned account before asking a collector to restore.
6. Document the resolution in the feedback record.
7. Resume invitations only when the readiness dashboard returns to six of six.

## Non-negotiable exclusions

- No public launch is authorized by this beta.
- No tobacco marketplace, brokerage, sales, or compensated transaction workflow is authorized.
- No Fox Cigar test, trial, tracking link, campaign, communication, or live integration may launch without Brian Bowers's specific approval.
- Private collection records are never supplied to manufacturers, retailers, lounges, partners, or other collectors.
