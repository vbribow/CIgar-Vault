import { createClient } from "@/lib/supabase/server";
import { checkoutSessionGrantsAccess, isBillablePlan, isBillingInterval, stripeHeaders } from "@/lib/billing";
import { NextResponse } from "next/server";
import { recordPaidPartnerConversion } from "@/lib/partner-platform";

export async function GET(request: Request) {
  const url = new URL(request.url), sessionId = url.searchParams.get("session_id");
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user || !sessionId) return NextResponse.redirect(new URL("/login", url.origin));
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`, { headers: stripeHeaders(), cache: "no-store" });
    const session = await response.json();
    if (!response.ok || session.client_reference_id !== user.id || !checkoutSessionGrantsAccess(session)) throw new Error("Checkout could not be verified");
    const subscription = session.subscription as { id: string; status: string; metadata?: Record<string, string> };
    const plan = subscription.metadata?.plan_id || session.metadata?.plan_id;
    const interval = subscription.metadata?.billing_interval || session.metadata?.billing_interval;
    if (!isBillablePlan(plan) || !isBillingInterval(interval)) throw new Error("Membership details could not be verified");
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, billing_plan: plan, billing_interval: interval, billing_status: subscription.status, stripe_customer_id: session.customer, stripe_subscription_id: subscription.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
    await recordPaidPartnerConversion({ userId: user.id, externalEventId: `checkout:${session.id}`, kind: "subscription_started", grossRevenueCents: Number(session.amount_total || 0), netRevenueCents: Number(session.amount_subtotal || session.amount_total || 0), currency: session.currency || "usd" });
    return NextResponse.redirect(new URL("/account?checkout=success", url.origin));
  } catch (error) { return NextResponse.redirect(new URL(`/pricing?error=${encodeURIComponent(error instanceof Error ? error.message : "Checkout verification failed")}`, url.origin)); }
}
