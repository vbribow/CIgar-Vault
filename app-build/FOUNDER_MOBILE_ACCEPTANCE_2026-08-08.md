# Founder mobile optimization acceptance

Use this short, read-mostly check after the optimized private build is explicitly deployed. It does not authorize deployment, database work, account creation, or changes to founder inventory.

## Safe setup

- Use the approved private preview address on one iPhone and one Android phone.
- Use a controlled test account containing only disposable test records.
- Keep one second signed-in device available for synchronization checks.
- Stop if any page identifies unavailable data as zero, empty, deleted, verified, or complete.

## Core phone journeys

Run each journey once at normal phone width and once with the on-screen keyboard open:

1. Home → Document my collection → camera documentation.
2. Home → Log Smoke → manual identity → save → Log this cigar again.
3. Vault → search → open one test record → edit a non-destructive note.
4. More → Search → open a result → return to the originating workspace.
5. Account → recovery → select a disposable test export → inspect impact without restoring.

Pass when the bottom navigation stays reachable, focused fields remain above the keyboard, no horizontal scrolling appears, loading feedback remains visible, and every unfinished entry is recoverable.

## Interruption and second-device checks

1. Begin a disposable form, temporarily disable the phone connection, and confirm the interruption notice says that saves are paused without implying record loss.
2. Reconnect and confirm the restored notice appears without clearing the unfinished form.
3. Save a disposable note on device one, then open the same test record on device two.
4. Attempt a stale edit from device two and confirm it is rejected rather than silently replacing the newer record.

## Recovery boundary

- Use only a controlled test export.
- Confirm file selection changes no records.
- Confirm the preview distinguishes missing, conflicting, and unchanged records.
- Restore only disposable records, then verify the recovery receipt and the second-device result.

Record device, browser, installed/browser mode, build identifier, date, pass/fail, and the exact visible message for any failure. Founder data must remain untouched throughout this protocol.
