# Stripe Test-Mode Acceptance Runbook

**Purpose:** Prove Hojavía billing safely before any live charge.  
**Boundary:** Test mode only. This runbook does not authorize live keys,
live products, customer outreach, or a real charge.

## One-time test configuration

1. In Stripe test mode, create four recurring prices using the approved terms:
   Collector $12 monthly, Collector $129 annually, Pro $25 monthly, and Pro
   $269 annually.
2. Configure the Stripe customer portal to allow payment-method updates,
   invoice history, and cancellation. Do not allow unsupported plan changes.
3. Create a test webhook endpoint at
   `https://app.hojavia.com/api/billing/webhook` for subscription created,
   updated, and deleted; invoice paid and payment failed; and charge refunded.
4. Apply `202611050001_stripe_test_readiness.sql` before enabling test checkout.
5. Add only protected Vercel environment values from `.env.example`. Set
   `STRIPE_BILLING_MODE=test`, use an `sk_test_` key, and place only approved
   test-account emails in `STRIPE_BILLING_TESTER_EMAILS`.
6. Redeploy only after the complete local batch passes and Brian approves the
   deployment. Never paste keys into chat, source files, screenshots, or logs.

## Required acceptance journeys

Record pass or fail for both Collector and Pro, monthly and annual:

- Successful test checkout returns to Account as pending, then becomes active
  only after the signed webhook is processed.
- A declined test card creates no paid entitlement.
- Refreshing or replaying the success URL creates no entitlement and no second
  subscription.
- Replaying the same webhook is harmless; an older event cannot overwrite a
  newer subscription state.
- The customer portal opens only for the signed-in owner of the linked Stripe
  customer.
- Payment-method update and invoice history work in the portal.
- Cancellation changes paid access at the configured boundary without deleting
  any Vault, journal, collection, sensor, photo, or export data.
- Payment failure produces the clear `payment attention` state and removes paid
  entitlements according to the approved grace rule.
- Renewal restores or retains the correct plan without creating duplicate
  partner credit.
- A test refund is recorded without changing private collection data.
- Sign-out, sign-in, and a second browser show the same authoritative plan.

## Evidence to retain

- Test product and price IDs (never secret keys).
- Webhook endpoint ID and subscribed event list.
- One Stripe request/event identifier for each journey.
- Hojavía account status before and after each event.
- Confirmation that records and exports remain intact after cancellation.
- Tester, date, result, and defect reference for every failed step.

## Activation rule

All journeys must pass with no unresolved security, entitlement, duplicate
charge, record-loss, or account-isolation defect. Brian must then separately
approve live billing. Live keys, live products, and a controlled real purchase
and refund are a later release action, not part of this batch.
