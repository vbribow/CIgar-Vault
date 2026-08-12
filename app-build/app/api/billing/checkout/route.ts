import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { billingConfigured, billingPriceId, isBillablePlan, isBillingInterval, stripeHeaders } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication is not configured")}`, 303);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent("/pricing")}`, 303);
  const form = await request.formData();
  const plan = form.get("plan") || "founder";
  const interval = form.get("interval") || "annual";
  if (!isBillablePlan(plan) || !isBillingInterval(interval) || (plan === "founder" && interval !== "annual")) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent("Choose a valid membership and billing interval")}`, 303);
  if (!billingConfigured(plan, interval)) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(`${plan} ${interval} checkout is prepared but not activated`)}`, 303);
  const priceId = billingPriceId(plan, interval)!;
  const body = new URLSearchParams({ mode: "subscription", "line_items[0][price]": priceId, "line_items[0][quantity]": "1", client_reference_id: user.id, customer_email: user.email || "", success_url: `${origin}/api/billing/confirm?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/pricing`, "metadata[user_id]": user.id, "metadata[plan_id]": plan, "metadata[billing_interval]": interval, "subscription_data[metadata][plan_id]": plan, "subscription_data[metadata][billing_interval]": interval, allow_promotion_codes: "true" });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: stripeHeaders(), body, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !result.url) return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(result.error?.message || "Unable to start checkout")}`, 303);
  return NextResponse.redirect(result.url, 303);
}
