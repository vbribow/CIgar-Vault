import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { billingConfigured, billingTesterAllowed, stripeHeaders, stripePriceId, type BillingInterval, type PaidBillingPlan } from "@/lib/billing";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication is not configured")}`, 303);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent("/pricing")}`, 303);
  if (!billingConfigured() || !billingTesterAllowed(user.email)) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent("Test checkout is not available for this account")}`, 303);

  const form = await request.formData();
  const plan = form.get("plan");
  const interval = form.get("interval");
  if ((plan !== "collector" && plan !== "pro") || (interval !== "month" && interval !== "year")) {
    return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent("Choose a valid membership and billing period")}`, 303);
  }
  const selectedPlan = plan as PaidBillingPlan;
  const selectedInterval = interval as BillingInterval;
  const priceId = stripePriceId(selectedPlan, selectedInterval);
  if (!priceId) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent("That test price is not configured")}`, 303);

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id,billing_status").eq("user_id", user.id).maybeSingle();
  if (profile?.stripe_customer_id && ["active", "trialing", "past_due"].includes(profile.billing_status || "")) {
    return NextResponse.redirect(`${origin}/account?error=${encodeURIComponent("Manage the existing membership from your billing portal")}`, 303);
  }
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: user.id,
    success_url: `${origin}/api/billing/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    "metadata[user_id]": user.id,
    "metadata[plan]": selectedPlan,
    "metadata[interval]": selectedInterval,
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][plan]": selectedPlan,
    allow_promotion_codes: "true",
  });
  if (profile?.stripe_customer_id) body.set("customer", profile.stripe_customer_id);
  else body.set("customer_email", user.email || "");
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: stripeHeaders(), body, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !result.url) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(result.error?.message || "Unable to start test checkout")}`, 303);
  return NextResponse.redirect(result.url, 303);
}
