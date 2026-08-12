import { normalizePlan, plans, type PlanId } from "./entitlements";

export type BillablePlanId = Exclude<PlanId, "free">;
export type BillingInterval = "monthly" | "annual";
export const billablePlans: BillablePlanId[] = ["collector", "reserve", "concierge", "founder"];
export const founderPlan = { ...plans.founder, interval: "year" } as const;

const priceEnvironmentKeys: Record<BillablePlanId, Partial<Record<BillingInterval, string>>> = {
  collector: { monthly: "STRIPE_COLLECTOR_MONTHLY_PRICE_ID", annual: "STRIPE_COLLECTOR_ANNUAL_PRICE_ID" },
  reserve: { monthly: "STRIPE_RESERVE_MONTHLY_PRICE_ID", annual: "STRIPE_RESERVE_ANNUAL_PRICE_ID" },
  concierge: { monthly: "STRIPE_CONCIERGE_MONTHLY_PRICE_ID", annual: "STRIPE_CONCIERGE_ANNUAL_PRICE_ID" },
  founder: { annual: "STRIPE_FOUNDER_PRICE_ID" },
};
export function isBillablePlan(value: unknown): value is BillablePlanId { return typeof value === "string" && billablePlans.includes(value as BillablePlanId); }
export function isBillingInterval(value: unknown): value is BillingInterval { return value === "monthly" || value === "annual"; }
export function billingPriceId(plan: BillablePlanId, interval: BillingInterval, environment: Record<string, string | undefined> = process.env) {
  const key = priceEnvironmentKeys[plan][interval];
  return key ? environment[key]?.trim() : undefined;
}
export function stripeConfigured(environment: Record<string, string | undefined> = process.env) { return Boolean(environment.STRIPE_SECRET_KEY?.trim()); }
export function billingConfigured(plan: BillablePlanId = "founder", interval: BillingInterval = "annual", environment: Record<string, string | undefined> = process.env) { return stripeConfigured(environment) && Boolean(billingPriceId(plan, interval, environment)); }
export function billingLabel(plan?: string | null, status?: string | null) {
  const normalized = normalizePlan(plan);
  const name = plans[normalized].name;
  if (normalized !== "free" && ["active", "trialing"].includes(status || "")) return `${name} active`;
  if (normalized !== "free" && status === "past_due") return `${name} · payment attention`;
  if (normalized !== "free" && status === "canceled") return `${name} · canceled`;
  return "Free";
}
export function stripeHeaders(secret = process.env.STRIPE_SECRET_KEY) { if (!secret) throw new Error("Stripe billing is not configured"); return { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" }; }
export function checkoutSessionGrantsAccess(session: { payment_status?: unknown; customer?: unknown; subscription?: unknown }) {
  if (!["paid", "no_payment_required"].includes(String(session.payment_status || ""))) return false;
  if (typeof session.customer !== "string" || !session.customer) return false;
  if (!session.subscription || typeof session.subscription !== "object") return false;
  const subscription = session.subscription as { id?: unknown; status?: unknown };
  return typeof subscription.id === "string" && Boolean(subscription.id) && ["active", "trialing"].includes(String(subscription.status || ""));
}
