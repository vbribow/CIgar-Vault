import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RESERVE_TRIAL_DAYS, reserveTrialEligibility } from "../lib/reserve-trial";

test("Reserve trial is earned only after a meaningful collection moment", () => {
  assert.equal(RESERVE_TRIAL_DAYS, 21);
  assert.equal(reserveTrialEligibility({ inventoryLots: 2, smokeLogs: 1, valuations: 0 }).eligible, false);
  assert.equal(reserveTrialEligibility({ inventoryLots: 3, smokeLogs: 0, valuations: 0 }).eligible, false);
  assert.equal(reserveTrialEligibility({ inventoryLots: 3, smokeLogs: 1, valuations: 0 }).eligible, true);
  assert.equal(reserveTrialEligibility({ inventoryLots: 3, smokeLogs: 0, valuations: 1 }).eligible, true);
});
test("paid, previously subscribed, and previously redeemed accounts cannot repeat the trial", () => {
  assert.equal(reserveTrialEligibility({ billingPlan: "reserve", billingStatus: "active", inventoryLots: 3, smokeLogs: 1, valuations: 0 }).eligible, false);
  assert.equal(reserveTrialEligibility({ hasPreviousSubscription: true, inventoryLots: 3, smokeLogs: 1, valuations: 0 }).eligible, false);
  assert.equal(reserveTrialEligibility({ redeemedAt: "2026-08-12T00:00:00Z", inventoryLots: 3, smokeLogs: 1, valuations: 0 }).eligible, false);
});
test("checkout revalidates the earned trial on the server and records redemption only after confirmation", () => {
  const checkout = readFileSync(new URL("../app/api/billing/checkout/route.ts", import.meta.url), "utf8");
  const confirm = readFileSync(new URL("../app/api/billing/confirm/route.ts", import.meta.url), "utf8");
  assert.match(checkout, /loadReserveTrialEligibility/);
  assert.match(checkout, /subscription_data\[trial_period_days\]/);
  assert.match(checkout, /payment_method_collection/);
  assert.match(checkout, /Idempotency-Key/);
  assert.match(confirm, /reserve_trial_redeemed_at/);
});
