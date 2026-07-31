import assert from "node:assert/strict"; import test from "node:test";
import { billingConfigured, billingLabel, checkoutSessionGrantsAccess, founderPlan } from "../lib/billing";
test("founder offer keeps the launch price",()=>{assert.equal(founderPlan.annualPrice,99);assert.equal(founderPlan.interval,"year")});
test("billing requires both Stripe secret and price",()=>{assert.equal(billingConfigured({STRIPE_SECRET_KEY:"sk_test",STRIPE_FOUNDER_PRICE_ID:"price_1"}),true);assert.equal(billingConfigured({STRIPE_SECRET_KEY:"sk_test"}),false)});
test("billing status has collector-friendly labels",()=>{assert.equal(billingLabel("founder","active"),"Founder active");assert.match(billingLabel("founder","past_due"),/attention/);assert.equal(billingLabel("free","inactive"),"Free preview")});
test("checkout grants access only after paid active or trialing subscription proof",()=>{
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",customer:"cus_1",subscription:{id:"sub_1",status:"active"}}),true);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"no_payment_required",customer:"cus_1",subscription:{id:"sub_1",status:"trialing"}}),true);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"unpaid",customer:"cus_1",subscription:{id:"sub_1",status:"active"}}),false);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",customer:"cus_1",subscription:{id:"sub_1",status:"past_due"}}),false);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",customer:"cus_1",subscription:"sub_unexpanded"}),false);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",subscription:{id:"sub_1",status:"active"}}),false);
});
