import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { billingConfigured, billingPriceId, isBillablePlan, isBillingInterval, stripeHeaders } from "@/lib/billing";
import { NextResponse } from "next/server";
import { loadReserveTrialEligibility, RESERVE_TRIAL_DAYS, RESERVE_TRIAL_OFFER } from "@/lib/reserve-trial";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication is not configured")}`, 303);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent("/pricing")}`, 303);
  const form = await request.formData();
  const plan = form.get("plan") || "founder";
  const interval = form.get("interval") || "annual";
  const requestedTrial = form.get("offer") === RESERVE_TRIAL_OFFER;
  if (!isBillablePlan(plan) || !isBillingInterval(interval) || (plan === "founder" && interval !== "annual")) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent("Choose a valid membership and billing interval")}`, 303);
  if (requestedTrial && plan !== "reserve") return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent("The earned trial applies only to Reserve")}`, 303);
  if (!billingConfigured(plan, interval)) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(`${plan} ${interval} checkout is prepared but not activated`)}`, 303);
  const priceId = billingPriceId(plan, interval)!;
  const trial = requestedTrial ? await loadReserveTrialEligibility(supabase, user.id) : undefined;
  if (requestedTrial && !trial?.eligible) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(trial?.reason || "This account is not eligible for the introductory trial")}`, 303);
  const body = new URLSearchParams({ mode: "subscription", "line_items[0][price]": priceId, "line_items[0][quantity]": "1", client_reference_id: user.id, customer_email: user.email || "", success_url: `${origin}/api/billing/confirm?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/pricing`, "metadata[user_id]": user.id, "metadata[plan_id]": plan, "metadata[billing_interval]": interval, "metadata[offer]": requestedTrial ? RESERVE_TRIAL_OFFER : "standard", "subscription_data[metadata][user_id]": user.id, "subscription_data[metadata][plan_id]": plan, "subscription_data[metadata][billing_interval]": interval, "subscription_data[metadata][offer]": requestedTrial ? RESERVE_TRIAL_OFFER : "standard", allow_promotion_codes: "true", ...(requestedTrial ? { payment_method_collection: "always", "subscription_data[trial_period_days]": String(RESERVE_TRIAL_DAYS) } : {}) });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { ...stripeHeaders(), ...(requestedTrial ? { "Idempotency-Key": `earned-reserve-trial-${user.id}` } : {}) }, body, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !result.url) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(result.error?.message || "Unable to start checkout")}`, 303);
  return NextResponse.redirect(result.url, 303);
}
