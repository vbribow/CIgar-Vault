# Authentication, Recovery, and Isolation Acceptance — October 7, 2026

## Local audit result

The local review covered signup, invitation enforcement, confirmation, sign-in, safe return paths, sign-out, password recovery, malformed/expired/reused email links, session refresh, protected-route redirects, account export, restore ownership, and signed-in record scoping.

Corrections in this batch:

- Both middleware layers now share one public-path definition. Referral redemption and partner invitation entry can no longer be accidentally protected by one layer but public in the other.
- Protected-route sign-in redirects preserve the intended internal path and query through the shared same-origin parser. Signed-in visits to Login also honor only a validated internal `next` target.
- Confirmation and recovery callbacks use the same safe-return parser and the configured canonical app origin. A crafted host or cross-origin destination cannot control the callback redirect.

Account data APIs reviewed in this milestone obtain the verified Supabase user and filter private records by that user ID. Missing configuration or unverifiable identity fails closed for private operations.

## Minimal production acceptance script

Use two approved test identities and disposable records only. Do not capture private collection content.

1. In a clean browser, open a protected URL containing a harmless query. Expected: Login appears and successful sign-in returns to that exact internal path and query.
2. Try `next=https://example.com`, `next=//example.com`, and a backslash-host form. Expected: all return to `/`, never an external origin.
3. Complete invitation-only signup and confirmation. Expected: every link begins at `app.hojavia.com`, creates one session, and reaches the intended internal page.
4. Reuse the confirmation link and open a malformed link. Expected: plain expired/used guidance with a safe sign-in/resend path; no account change.
5. Request password recovery, set a new password, sign out, and sign in with the new password. Expected: old password fails; recovery never returns to the public apex.
6. Reuse the recovery link. Expected: it cannot authorize another password change and gives a clear next action.
7. Close and reopen the installed PWA. Expected: valid session restores; signed-out state remains signed out.
8. With Identity A create a disposable record. With Identity B search, export, restore-preview, edit, and delete using A's record ID. Expected: B cannot see or mutate A's record.
9. Export A's records and preview under B. Expected: different-owner warning and no write without the explicit acknowledgement and recovery confirmation phrase.
10. Record PASS, FAIL, BLOCKED, or NOT RUN for each step with timestamp, browser/device, non-sensitive screenshot, and any returned status. Any cross-account visibility, external redirect, or unauthorized password change is Severity 1 and keeps launch on HOLD.
