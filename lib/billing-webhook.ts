import { createHmac, timingSafeEqual } from "node:crypto";

export type BillingProfileChange = {
  customerId: string;
  subscriptionId?: string;
  billingPlan: "founder";
  billingStatus: string;
};

const subscriptionStatuses = new Set([
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export function validStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
  nowSeconds = Date.now() / 1000,
) {
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

function stringField(object: Record<string, unknown>, key: string) {
  return typeof object[key] === "string" ? object[key] as string : undefined;
}

export function billingProfileChangeForEvent(
  eventType: string,
  object: Record<string, unknown>,
): BillingProfileChange | undefined {
  const customerId = stringField(object, "customer");
  if (!customerId) return undefined;

  if (eventType.startsWith("customer.subscription.")) {
    const status = eventType === "customer.subscription.deleted"
      ? "canceled"
      : stringField(object, "status");
    if (!status || !subscriptionStatuses.has(status)) return undefined;
    return {
      customerId,
      subscriptionId: stringField(object, "id"),
      billingPlan: "founder",
      billingStatus: status,
    };
  }

  if (eventType === "invoice.payment_failed") {
    const subscriptionId = stringField(object, "subscription");
    if (!subscriptionId) return undefined;
    return {
      customerId,
      subscriptionId,
      billingPlan: "founder",
      billingStatus: "past_due",
    };
  }

  if (eventType === "invoice.paid") {
    const subscriptionId = stringField(object, "subscription");
    if (!subscriptionId) return undefined;
    return {
      customerId,
      subscriptionId,
      billingPlan: "founder",
      billingStatus: "active",
    };
  }

  return undefined;
}
