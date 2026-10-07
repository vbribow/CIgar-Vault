# Local Release Candidate Freeze

**Frozen:** October 7, 2026
**Decision:** `HOLD`
**Scope:** Local evidence only; nothing was deployed or published.

## Candidate identity

- Branch: `codex/release-sensor-h25`
- Parent commit: `f4f1f83af57a0a9a31d6463b588a9cf5a45cc2d0`
- Private-app artifact release: `hojavia-beta-shell-v4-1b490cffc9b5`
- Private-app release manifest SHA-256: `2c87387ef0d0114ed2d67a643eda033bb7011f93d78c60f9b611cd6667e9d4f9`
- Local rollback baseline SHA-256: `58af9b94c69712f9fce57f4d14ed1e135b3ff48f47ff433b2e2547ac23e279b4`
- Public website: validated from the existing separate `hojavia-website` workspace; its unrelated pre-existing changes remain unstaged and were not modified by this batch.

The final local commit created from this candidate becomes the authoritative source identity. Build output remains uncommitted and reproducible from that source and the locked dependencies.

## Validation record

| Check | Result | Evidence |
| --- | --- | --- |
| Private-app TypeScript | PASS | `tsc --noEmit` completed without error |
| Private-app automated suite | PASS | 1,186 passed; 0 failed |
| Mobile reliability contracts | PASS | 10/10 |
| Internal navigation | PASS | 193 routes across 536 source files |
| Critical launch journeys | PASS | Seven automated journey contracts included in the full suite |
| Performance budgets | PASS | Source and built client assets |
| Private-app production build | PASS | Vinext artifact stamped `1b490cffc9b5` |
| Public-site production build | PASS | Separate Vinext build completed |
| Public-site tests | PASS | 33 passed; 0 failed |
| Local rollback rehearsal | PASS | Invalid candidate rejected; damage detected; previous artifact restored; cleanup completed |
| Diff whitespace check | PASS | `git diff --check` |

## Included local outcomes

- First-record photo intake now distinguishes a draft from a saved Vault record and requires explicit confirmation.
- No-result search paths preserve the query and offer research, manual entry, or Vault recovery.
- Home and feature language now lead with collector outcomes instead of internal or AI-led terminology.
- Founder funnel metrics are privacy-minimized, distinguish missing data from zero, exclude configured founder accounts, and now record consent-aware Cigar Somm and import milestones without cigar content.
- Pricing and entitlements state clearly that paid tiers are proposed, owner data stays visible, and billing is not active.
- Stripe test-mode acceptance is documented; live/test credentials and resources remain untouched.
- Public website claims were mapped to release behavior and found appropriately bounded; public release and commerce remain held.
- One founder packet now covers iPhone, Android, desktop, synchronization, accessibility, recovery, photo, import, backup, restore, and sign-out/reopen evidence.

## Why the decision is HOLD

Local software evidence is strong enough for a controlled founder acceptance cycle, but it is not sufficient for public launch. These external/human gates remain open:

1. Physical iPhone Safari/PWA and Android Chrome/PWA acceptance.
2. VoiceOver, Android screen-reader, keyboard, camera reuse, scrolling, and installed-app update acceptance.
3. Real-account recovery, second-device stale-write, export, backup, and isolated restore acceptance.
4. Seven current production-like days without a Severity 1 or critical-path Severity 2 defect.
5. Final privacy, terms, adult-category, retention, support-owner, incident-owner, trademark, and public-release review.
6. Production database migration baseline and backup acceptance before any migration.
7. Google Places scope/production acceptance if it remains in launch scope.
8. Stripe credentialed test-mode acceptance before any paid launch. Free controlled beta may proceed without Stripe after the other gates pass.
9. Public website source must be committed to an identifiable clean candidate before public publication.

## Rollback trigger

Rollback or disable the affected surface immediately for data loss, cross-account disclosure, authentication bypass, unrecoverable recovery, destructive restore, duplicate durable writes, silent stale overwrite, false success after failure, or a blocking installed-app update defect. Preserve logs and the affected release identity; do not repeatedly retry destructive actions.

## Next controlled action

Commit this local candidate without unrelated public-site changes. After separate deployment approval, deploy the private-app commit, confirm the release identifier, and execute the founder packet. The decision may advance only from recorded evidence—not from the clean local build alone.
