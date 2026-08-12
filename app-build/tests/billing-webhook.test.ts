import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { billingProfileChangeForEvent, validStripeSignature } from "../lib/billing-webhook";

test("Stripe signatures accept a current matching v1 value and reject stale or mismatched values", () => {
  const payload = '{"id":"evt_test"}';
  const secret = "whsec_test";
  const timestamp = 2_000_000_000;
  const digest = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  assert.equal(validStripeSignature(payload, `t=${timestamp},v1=old,v1=${digest}`, secret, timestamp), true);
  assert.equal(validStripeSignature(payload, `t=${timestamp},v1=wrong`, secret, timestamp), false);
  assert.equal(validStripeSignature(payload, `t=${timestamp - 301},v1=${digest}`, secret, timestamp), false);
});

test("subscription lifecycle events produce authoritative account status changes", () => {
  assert.deepEqual(
    billingProfileChangeForEvent("customer.subscription.updated", {
      id: "sub_1",
      customer: "cus_1",
      status: "trialing",
    }),
    {
      customerId: "cus_1",
      subscriptionId: "sub_1",
      billingPlan: "founder",
      billingInterval: "annual",
      billingStatus: "trialing",
    },
  );
  assert.equal(
    billingProfileChangeForEvent("customer.subscription.deleted", {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
    })?.billingStatus,
    "canceled",
  );
  assert.equal(
    billingProfileChangeForEvent("customer.subscription.updated", {
      id: "sub_1",
      customer: "cus_1",
      status: "unknown",
    }),
    undefined,
  );
});

test("subscription metadata can safely recover an earned trial when the success redirect is missed", () => {
  const change = billingProfileChangeForEvent("customer.subscription.created", { id: "sub_trial", customer: "cus_trial", status: "trialing", metadata: { user_id: "123e4567-e89b-12d3-a456-426614174000", plan_id: "reserve", billing_interval: "monthly", offer: "earned-reserve-21" } });
  assert.equal(change?.userId, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(change?.billingPlan, "reserve");
  assert.equal(change?.reserveTrialRedeemed, true);
});

test("invoice success and failure reconcile billing status without inventing a customer", () => {
  assert.equal(
    billingProfileChangeForEvent("invoice.payment_failed", {
      customer: "cus_1",
      subscription: "sub_1",
    })?.billingStatus,
    "past_due",
  );
  assert.equal(
    billingProfileChangeForEvent("invoice.paid", {
      customer: "cus_1",
      subscription: "sub_1",
    })?.billingStatus,
    "active",
  );
  assert.equal(billingProfileChangeForEvent("invoice.paid", { customer: "cus_1" }), undefined);
  assert.equal(billingProfileChangeForEvent("invoice.paid", {}), undefined);
});

test("billing routes use verified checkout state and lifecycle reconciliation", () => {
  const confirm = readFileSync(new URL("../app/api/billing/confirm/route.ts", import.meta.url), "utf8");
  const webhook = readFileSync(new URL("../app/api/billing/webhook/route.ts", import.meta.url), "utf8");
  const entitlements = readFileSync(new URL("../lib/entitlements-server.ts", import.meta.url), "utf8");
  assert.match(confirm, /checkoutSessionGrantsAccess/);
  assert.match(webhook, /billingProfileChangeForEvent/);
  assert.match(webhook, /stripe_customer_id/);
  assert.match(entitlements, /billing_plan,billing_status/);
  assert.match(entitlements, /effectivePlan/);
});
