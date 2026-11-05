import assert from "node:assert/strict"; import test from "node:test";
import { billingConfigured, billingLabel, billingTesterAllowed, checkoutSessionGrantsAccess, founderPlan, planForStripePrice, publicPricing, stripePriceId } from "../lib/billing";
test("founder offer keeps the launch price",()=>{assert.equal(founderPlan.annualPrice,99);assert.equal(founderPlan.interval,"year")});
const testBillingEnvironment={STRIPE_BILLING_MODE:"test",STRIPE_SECRET_KEY:"sk_test_example",STRIPE_WEBHOOK_SECRET:"whsec_example",STRIPE_COLLECTOR_MONTHLY_PRICE_ID:"price_cm",STRIPE_COLLECTOR_ANNUAL_PRICE_ID:"price_ca",STRIPE_PRO_MONTHLY_PRICE_ID:"price_pm",STRIPE_PRO_ANNUAL_PRICE_ID:"price_pa",STRIPE_BILLING_TESTER_EMAILS:"brian@example.com, tony@example.com"};
test("billing configuration requires test mode, a test key, webhook secret, and all four prices",()=>{assert.equal(billingConfigured(testBillingEnvironment),true);assert.equal(billingConfigured({...testBillingEnvironment,STRIPE_PRO_ANNUAL_PRICE_ID:undefined}),false);assert.equal(billingConfigured({...testBillingEnvironment,STRIPE_SECRET_KEY:"sk_live_no"}),false)});
test("test checkout is allowlisted and maps plans to server-controlled Stripe prices",()=>{assert.equal(billingTesterAllowed("BRIAN@example.com",testBillingEnvironment),true);assert.equal(billingTesterAllowed("other@example.com",testBillingEnvironment),false);assert.equal(stripePriceId("collector","year",testBillingEnvironment),"price_ca");assert.equal(planForStripePrice("price_pm",testBillingEnvironment),"pro");assert.equal(planForStripePrice("price_unknown",testBillingEnvironment),undefined)});
test("public pricing preserves the agreed monthly plans and modest annual discount",()=>{assert.deepEqual(publicPricing.collector,{name:"Collector",monthlyPrice:12,annualPrice:129,annualSavings:15});assert.deepEqual(publicPricing.pro,{name:"Pro",monthlyPrice:25,annualPrice:269,annualSavings:31})});
test("billing status has collector-friendly labels",()=>{assert.equal(billingLabel("founder","active"),"Founder active");assert.match(billingLabel("founder","past_due"),/attention/);assert.equal(billingLabel("free","inactive"),"Free preview")});
test("checkout grants access only after paid active or trialing subscription proof",()=>{
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",customer:"cus_1",subscription:{id:"sub_1",status:"active"}}),true);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"no_payment_required",customer:"cus_1",subscription:{id:"sub_1",status:"trialing"}}),true);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"unpaid",customer:"cus_1",subscription:{id:"sub_1",status:"active"}}),false);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",customer:"cus_1",subscription:{id:"sub_1",status:"past_due"}}),false);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",customer:"cus_1",subscription:"sub_unexpanded"}),false);
  assert.equal(checkoutSessionGrantsAccess({payment_status:"paid",subscription:{id:"sub_1",status:"active"}}),false);
});
