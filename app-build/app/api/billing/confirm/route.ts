import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { billingTesterAllowed, checkoutSessionGrantsAccess, planForStripePrice, stripeHeaders } from "@/lib/billing";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !sessionId) return NextResponse.redirect(new URL("/login", url.origin));
  if (!billingTesterAllowed(user.email)) return NextResponse.redirect(new URL("/pricing?error=Test%20checkout%20is%20not%20available", url.origin));
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`, { headers: stripeHeaders(), cache: "no-store" });
    const session = await response.json();
    const subscription = session.subscription as { items?: { data?: Array<{ price?: { id?: unknown } }> } } | undefined;
    const plan = planForStripePrice(subscription?.items?.data?.[0]?.price?.id);
    if (!response.ok || session.client_reference_id !== user.id || !checkoutSessionGrantsAccess(session) || !plan) throw new Error("Checkout could not be verified");
    // Only the signed webhook grants access. A browser return never changes entitlements.
    return NextResponse.redirect(new URL("/account?checkout=pending", url.origin));
  } catch (error) {
    return NextResponse.redirect(new URL(`/pricing?error=${encodeURIComponent(error instanceof Error ? error.message : "Checkout verification failed")}`, url.origin));
  }
}
