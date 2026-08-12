import { NextResponse } from "next/server";
import { billingProfileChangeForEvent, validStripeSignature } from "@/lib/billing-webhook";
import { partnerAdmin, recordPaidPartnerConversion, reversePartnerConversion } from "@/lib/partner-platform";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  if (!validStripeSignature(payload, request.headers.get("stripe-signature"), secret)) return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
  try {
    const event = JSON.parse(payload) as { id:string;type:string;data?:{object?:Record<string,unknown>} };
    const object = event.data?.object;
    if (!event.id || !event.type || !object) return NextResponse.json({ error: "Invalid Stripe event" }, { status: 400 });

    const profileChange = billingProfileChangeForEvent(event.type, object);
    if (profileChange) {
      const admin = partnerAdmin();
      if (!admin) throw new Error("Billing profile storage is not configured");
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", profileChange.customerId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.user_id) throw new Error("Billing customer is not linked to an account");
      const { error: updateError } = await admin
        .from("profiles")
        .update({
          ...(profileChange.billingPlan ? { billing_plan: profileChange.billingPlan } : {}),
          ...(profileChange.billingInterval ? { billing_interval: profileChange.billingInterval } : {}),
          billing_status: profileChange.billingStatus,
          ...(profileChange.subscriptionId ? { stripe_subscription_id: profileChange.subscriptionId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);
      if (updateError) throw updateError;
    }

    if (event.type === "invoice.paid" && object.billing_reason !== "subscription_create") {
      const customerId = typeof object.customer === "string" ? object.customer : "";
      const admin = partnerAdmin();
      const { data: profile } = admin && customerId ? await admin.from("profiles").select("user_id").eq("stripe_customer_id", customerId).maybeSingle() : { data: null };
      if (profile?.user_id) await recordPaidPartnerConversion({
        userId: profile.user_id,
        externalEventId: `invoice:${String(object.id)}`,
        kind: "invoice_paid",
        grossRevenueCents: Number(object.amount_paid || 0),
        netRevenueCents: Number(object.total_excluding_tax ?? object.subtotal ?? object.amount_paid ?? 0),
        currency: String(object.currency || "usd"),
        occurredAt: typeof object.status_transitions === "object" && object.status_transitions && "paid_at" in object.status_transitions
          ? new Date(Number((object.status_transitions as { paid_at?:number }).paid_at || Date.now() / 1000) * 1000).toISOString()
          : undefined,
      });
    }
    if (event.type === "charge.refunded" && typeof object.invoice === "string") await reversePartnerConversion(`invoice:${object.invoice}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Partner webhook processing failed" }, { status: 500 });
  }
}
