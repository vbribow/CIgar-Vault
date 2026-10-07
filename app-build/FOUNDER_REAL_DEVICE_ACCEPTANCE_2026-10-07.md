# Founder Real-Device Acceptance Packet

**Prepared:** October 7, 2026
**Purpose:** Final human acceptance for the installable Hojavía PWA
**Result choices:** `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`

Use a dedicated test account and synthetic or non-sensitive records. Screenshots should show only the affected control, status, and time; crop names, email addresses, cigar values, sensor identifiers, addresses, and collection details unless they are essential evidence.

## Stop rules

- Stop expansion for any data loss, cross-account disclosure, authentication bypass, unrecoverable account, duplicate write, destructive restore, or false success state.
- Do not retry a destructive step repeatedly. Preserve the device, time, route, release identifier, and exact message.
- Contain a failure by disabling the affected invitation or feature, keeping owner data accessible, and returning to the last known-good release only under the documented rollback trigger.

## Acceptance record

For every check, record: result, date/time, device/browser/OS, release identifier, evidence filename or issue link, and tester initials.

### A. iPhone Safari and installed PWA

**Prerequisites:** Current iPhone, Safari, test account, camera permission, one synthetic photo, release identifier visible.

1. Open the canonical app URL in Safari, sign in, navigate Home → Vault → detail → Back. Install to Home Screen, close Safari, then open the installed app.
2. Add one provisional cigar by text; correct its identity; save it; confirm exactly one record and a clear success state.
3. Add two photos, close the photo/camera flow, then open it again. Confirm the camera is released and works on the second attempt.
4. Open and close a detail/editor sheet three times, including with the keyboard visible. Confirm vertical scrolling always returns and no hidden banner blocks controls.
5. Sign out, force-close, reopen, and confirm protected data is unavailable until sign-in.

**Expected:** Stable navigation, visible controls above safe areas, deterministic save return, one durable record, reusable camera, working scroll, and protected reopen.
**Evidence:** Cropped success state, installed icon/release screen, and one short screen recording only if a defect occurs.
**Failure severity:** Critical for disclosure/data loss; high for blocked save, camera lock, scrolling, or sign-out.
**Containment:** Hold iPhone/PWA invitations or affected feature; do not advise reinstall as the permanent fix.

### B. Android Chrome and installed PWA

**Prerequisites:** Supported Android phone, current Chrome, test account, camera permission.

Repeat A1–A5 using Chrome and Add to Home Screen/Install App. Also verify Android Back closes an open sheet before leaving the route.

**Expected:** Same record, camera, keyboard, back, scroll, sign-out, and reopen behavior as iPhone.
**Evidence:** Cropped release/status screens and defect-only recording.
**Failure severity:** Same as iPhone.
**Containment:** Hold Android/PWA invitations or affected feature.

### C. Desktop critical journey

**Prerequisites:** Current Chrome or Safari, test account.

1. Sign in, search Vault, open a result, edit all details, save, and return to the same record.
2. Log one smoke from inventory and one from outside the Vault. Confirm inventory changes only for the first.
3. Open pricing, reports, community ratings, Cigar Somm, Sensors, account/export, and recovery controls.
4. Sign out and use browser Back; confirm private pages do not reappear as usable authenticated content.

**Expected:** No loops, stale forms, duplicate writes, false success, or accidental inventory reduction.
**Evidence:** One cropped post-save record and any defect console/network reference without tokens.
**Failure severity:** Critical for isolation/data corruption; high for blocked core journey.
**Containment:** Hold affected route; preserve account access and exports.

### D. Second-device synchronization and stale-write protection

**Prerequisites:** Same test account on two physical devices; one test record with a known quantity.

1. Open the same record on both devices.
2. On device A, change a harmless detail and save.
3. On device B, attempt to save its older version.
4. Refresh B, review A's change, make the intended update, and save.

**Expected:** B cannot silently overwrite A; message names the conflict and recovery action; refreshed save succeeds once without duplication.
**Evidence:** Cropped conflict and final record.
**Failure severity:** Critical if newer data is silently lost; high if recovery loops.
**Containment:** Hold multi-device editing and advise one active device only until fixed.

### E. Keyboard and assistive technology

**Prerequisites:** Hardware/software keyboard; iPhone VoiceOver; Android TalkBack or the approved native screen reader.

1. Complete sign-in, global search, first-record add, save, modal close, navigation, and error recovery by keyboard only on desktop.
2. Repeat the first-record path with VoiceOver and Android screen reader.
3. Confirm labels, selected state, errors, success messages, focus order, focus return, and button purpose are spoken clearly.

**Expected:** No keyboard trap, lost focus, unlabeled control, color-only error, or inaccessible success message.
**Evidence:** Checklist notes; no private screen-reader transcript.
**Failure severity:** High when a critical journey is blocked; medium for non-blocking clarity.
**Containment:** Document inaccessible path and provide a direct supported alternative before expansion.

### F. Recovery, sign-out, and reopen

**Prerequisites:** Test mailbox controlled by founder; signed-in and signed-out device.

1. Request password recovery once. Use the current link, set a new password, and sign in.
2. Reuse the link and try a malformed/expired link.
3. Verify each failure explains how to request a fresh link without exposing account existence or unsafe redirect.
4. Sign out all tested surfaces and reopen.

**Expected:** One-time current link succeeds; reused/malformed/expired links fail safely; protected data remains closed.
**Evidence:** Cropped neutral recovery outcome; omit email and token.
**Failure severity:** Critical for takeover/bypass; high for unrecoverable account.
**Containment:** Hold new invitations and use founder-assisted recovery only through the approved identity process.

### G. Photo intake

**Prerequisites:** Two non-sensitive cigar photos and camera permission.

1. Identify by photo, review uncertainty, correct identity, and verify that the Vault is unchanged before explicit Add to Vault.
2. Add, confirm one record and two photos, then repeat the camera flow.
3. Deny camera permission once and confirm a clear recovery path.

**Expected:** Draft is never called saved; explicit confirmation creates one record; two-photo limit works; camera releases; permission failure is understandable.
**Evidence:** Cropped draft/confirmation states.
**Failure severity:** High for wrong/duplicate save or frozen camera.
**Containment:** Disable photo intake while retaining manual add.

### H. Import, export, backup, and restore

**Prerequisites:** Synthetic CSV/XLSX fixture, complete export, fresh test account or isolated test dataset.

1. Preview import, inspect mapping and rejected rows, deselect one row, acknowledge a duplicate, and commit.
2. Reimport the same accepted file; confirm no silent duplication.
3. Download complete export and recovery point; open both and confirm understandable records.
4. Restore only in the approved isolated test context. Create a newer conflicting record before restore.

**Expected:** Preview precedes commit; partial failures are explained; reimport is idempotent; export opens; restore refuses silent overwrite of newer data.
**Evidence:** Redacted counts/receipt and restore result; never upload the backup to an issue.
**Failure severity:** Critical for overwrite, disclosure, or unexplained partial commit.
**Containment:** Hold imports/restores; leave export available.

## Founder sign-off

| Gate | Result | Evidence | Open issue / owner |
| --- | --- | --- | --- |
| iPhone Safari/PWA | NOT RUN |  |  |
| Android Chrome/PWA | NOT RUN |  |  |
| Desktop critical journey | NOT RUN |  |  |
| Second-device sync | NOT RUN |  |  |
| Keyboard | NOT RUN |  |  |
| VoiceOver | NOT RUN |  |  |
| Android screen reader | NOT RUN |  |  |
| Recovery/sign-out/reopen | NOT RUN |  |  |
| Photo intake | NOT RUN |  |  |
| Import/export/backup/restore | NOT RUN |  |  |

**Founder decision:** `HOLD` / `READY FOR CONTROLLED BETA` / `READY FOR FOUNDER GO/NO-GO`
**Name/date:**
**Residual risk accepted:**
