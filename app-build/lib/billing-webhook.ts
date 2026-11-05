import { createHmac, timingSafeEqual } from "node:crypto";
import { planForStripePrice, type PaidBillingPlan } from "@/lib/billing";

export type BillingProfileChange = { customerId: string; subscriptionId?: string; billingPlan: PaidBillingPlan; billingStatus: string };
const subscriptionStatuses = new Set(["active", "trialing", "past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]);

export function validStripeSignature(payload: string, signature: string | null, secret: string, nowSeconds = Date.now() / 1000) {
  if (!signature || !secret) return false;
  const parts = signature.split(",").map(part => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const supplied = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !supplied.length || Math.abs(nowSeconds - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBytes = Buffer.from(expected);
  return supplied.some(value => {
    const suppliedBytes = Buffer.from(value || "");
    return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
  });
}

function stringField(object: Record<string, unknown>, key: string) { return typeof object[key] === "string" ? object[key] as string : undefined; }
function nestedPriceId(object: Record<string, unknown>) {
  const items = object.items as { data?: Array<{ price?: { id?: unknown } }> } | undefined;
  const direct = items?.data?.[0]?.price?.id;
  if (typeof direct === "string") return direct;
  const lines = object.lines as { data?: Array<{ price?: { id?: unknown } }> } | undefined;
  const invoice = lines?.data?.[0]?.price?.id;
  return typeof invoice === "string" ? invoice : undefined;
}

export function billingProfileChangeForEvent(eventType: string, object: Record<string, unknown>): BillingProfileChange | undefined {
  const customerId = stringField(object, "customer");
  if (!customerId) return undefined;
  const billingPlan = planForStripePrice(nestedPriceId(object));
  if (!billingPlan) return undefined;
  if (eventType.startsWith("customer.subscription.")) {
    const status = eventType === "customer.subscription.deleted" ? "canceled" : stringField(object, "status");
    if (!status || !subscriptionStatuses.has(status)) return undefined;
    return { customerId, subscriptionId: stringField(object, "id"), billingPlan, billingStatus: status };
  }
  if (eventType === "invoice.payment_failed" || eventType === "invoice.paid") {
    const subscriptionId = stringField(object, "subscription");
    if (!subscriptionId) return undefined;
    return { customerId, subscriptionId, billingPlan, billingStatus: eventType === "invoice.paid" ? "active" : "past_due" };
  }
  return undefined;
}
