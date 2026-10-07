# Stripe test-mode acceptance

**State:** Local implementation prepared. Billing remains disabled. No Stripe resource, credential, webhook, subscription, or charge was created during this pass.

## Proven locally

- Checkout requires a signed-in account and both server-side Stripe configuration values.
- The browser success redirect does not grant access by itself. The server retrieves the Checkout Session from Stripe, verifies the account reference, customer, subscription object, payment state, and active or trialing subscription state.
- Webhooks reject missing, stale, or invalid signatures and use constant-time signature comparison.
- Subscription deletion, cancellation, past-due, unpaid, incomplete, expired, and paused states fail closed through `effectivePlan`.
- Replayed revenue events use stable external event identifiers. Profile status updates are idempotent for the same resulting state.
- Losing paid entitlement never deletes, rewrites, or hides owner records; export remains owner controlled.
- Portal and checkout return to the same application origin that initiated the server request.

## Exact credentialed test-mode procedure

Run only after separate founder approval for Stripe test mode.

1. Create one Stripe **test-mode** annual Founder price matching the approved internal offer. Do not create live-mode resources.
2. Add test values for `STRIPE_SECRET_KEY`, `STRIPE_FOUNDER_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` to a non-production environment.
3. Register the non-production `/api/billing/webhook` endpoint for subscription updates/deletion, invoice paid/failed, and charge refunded.
4. Use a new synthetic account. Confirm checkout requires sign-in and displays Stripe test mode.
5. Complete checkout with a Stripe test card. Confirm the return URL alone cannot activate a mismatched account or session.
6. Confirm the verified session grants the Founder entitlement and saves customer/subscription identifiers only to that account.
7. Replay the same webhook twice. Confirm no duplicate conversion or entitlement side effect.
8. Deliver an older event after a newer status event. Confirm the final Stripe subscription state is reconciled before any paid launch; if this cannot be demonstrated, keep billing disabled.
9. Trigger payment failure and cancellation. Confirm paid features fail closed while every owner record and export remains available.
10. Restore payment in Stripe test mode and confirm verified server-side state restores entitlement.
11. Open the customer portal, return to the application, and confirm the account page explains the current state.
12. Capture redacted request IDs, timestamps, final account state, and screenshots. Never capture keys, full payment data, private collection contents, or session tokens.

## Paid-launch hold

Billing remains a separate launch. Do not enable live credentials until replay/out-of-order delivery, cancellation, past-due recovery, receipts, support recovery, price/legal copy, and founder go/no-go have dated evidence.
