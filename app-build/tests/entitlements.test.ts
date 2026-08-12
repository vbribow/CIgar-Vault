import assert from "node:assert/strict";
import test from "node:test";
import { collectorProfile, effectivePlan, hasEntitlement, normalizePlan, plans, upgradeSuggestion } from "../lib/entitlements";

test("membership definitions preserve value and cost boundaries", () => {
  assert.equal(plans.free.inventoryLimit, 25);
  assert.equal(plans.collector.monthlyPrice, 9.99);
  assert.equal(plans.reserve.monthlyAiCredits, 150);
  assert.equal(plans.concierge.providerCostCeilingCents, 1500);
  for (const feature of ["unlimited-inventory", "professional-ratings", "climate-sensors", "automations", "concierge-support"] as const) assert.equal(hasEntitlement("founder", feature), true);
});
test("legacy Pro accounts become Reserve and unknown plans fail safely", () => { assert.equal(normalizePlan("pro"), "reserve"); assert.equal(normalizePlan("legacy-mystery"), "free"); });
test("upgrade suggestions respond to actual usage", () => { assert.equal(upgradeSuggestion("free", "inventory", 19), undefined); assert.equal(upgradeSuggestion("free", "inventory", 20)?.target, "collector"); assert.equal(upgradeSuggestion("collector", "sensors")?.target, "reserve"); assert.equal(upgradeSuggestion("founder", "ratings"), undefined); });
test("high-end collection signals receive stewardship recommendations", () => { assert.equal(collectorProfile({ portfolioValue: 120000 }), "estate"); assert.equal(upgradeSuggestion("reserve", "reports", 0, { portfolioValue: 120000 })?.target, "concierge"); });
test("paid plans fail closed when billing is not active or trialing", () => { assert.equal(effectivePlan("founder", "active"), "founder"); assert.equal(effectivePlan("pro", "trialing"), "reserve"); for (const status of ["past_due", "canceled", "unpaid", "incomplete", undefined]) assert.equal(effectivePlan("founder", status), "free"); assert.equal(effectivePlan("free", "inactive"), "free"); });
