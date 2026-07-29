import assert from "node:assert/strict"; import test from "node:test";
import { billingConfigured, billingLabel, founderPlan } from "../lib/billing";
test("founder offer keeps the launch price",()=>{assert.equal(founderPlan.annualPrice,99);assert.equal(founderPlan.interval,"year")});
test("billing requires both Stripe secret and price",()=>{assert.equal(billingConfigured({STRIPE_SECRET_KEY:"sk_test",STRIPE_FOUNDER_PRICE_ID:"price_1"}),true);assert.equal(billingConfigured({STRIPE_SECRET_KEY:"sk_test"}),false)});
test("billing status has collector-friendly labels",()=>{assert.equal(billingLabel("founder","active"),"Founder active");assert.match(billingLabel("founder","past_due"),/attention/);assert.equal(billingLabel("free","inactive"),"Free preview")});
