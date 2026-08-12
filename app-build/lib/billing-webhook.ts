import { createHmac, timingSafeEqual } from "node:crypto";
import { isBillablePlan, isBillingInterval, type BillablePlanId, type BillingInterval } from "./billing";

export type BillingProfileChange = {
  customerId: string;
  userId?: string;
  subscriptionId?: string;
  billingPlan?: BillablePlanId;
  billingInterval?: BillingInterval;
  billingStatus: string;
  reserveTrialRedeemed?: boolean;
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

function membershipMetadata(object: Record<string, unknown>) {
  const metadata = object.metadata && typeof object.metadata === "object" ? object.metadata as Record<string, unknown> : {};
  const plan = metadata.plan_id;
  const interval = metadata.billing_interval;
  return { plan: isBillablePlan(plan) ? plan : undefined, interval: isBillingInterval(interval) ? interval : undefined };
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
    const membership = membershipMetadata(object);
    const metadata = object.metadata && typeof object.metadata === "object" ? object.metadata as Record<string, unknown> : {};
    const userId = typeof metadata.user_id === "string" && /^[0-9a-f-]{36}$/i.test(metadata.user_id) ? metadata.user_id : undefined;
    return {
      customerId,
      ...(userId ? { userId } : {}),
      subscriptionId: stringField(object, "id"),
      billingPlan: membership.plan ?? "founder",
      billingInterval: membership.interval ?? "annual",
      billingStatus: status,
      ...(metadata.offer === "earned-reserve-21" ? { reserveTrialRedeemed: true } : {}),
    };
  }

  if (eventType === "invoice.payment_failed") {
    const subscriptionId = stringField(object, "subscription");
    if (!subscriptionId) return undefined;
    return {
      customerId,
      subscriptionId,
      billingStatus: "past_due",
    };
  }

  if (eventType === "invoice.paid") {
    const subscriptionId = stringField(object, "subscription");
    if (!subscriptionId) return undefined;
    return {
      customerId,
      subscriptionId,
      billingStatus: "active",
    };
  }

  return undefined;
}
