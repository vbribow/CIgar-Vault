export type PaidBillingPlan = "collector" | "pro";
export type BillingInterval = "month" | "year";

export const publicPricing = {
  free: { name: "Free", monthlyPrice: 0, annualPrice: 0, annualSavings: 0 },
  collector: { name: "Collector", monthlyPrice: 12, annualPrice: 129, annualSavings: 15 },
  pro: { name: "Pro", monthlyPrice: 25, annualPrice: 269, annualSavings: 31 },
} as const;

export const founderPlan = {
  name: "Founder", annualPrice: 99, interval: "year",
  features: ["Unlimited cigar and collection records", "Professional ratings and valuation research", "Humidor climate monitoring and alerts", "Insurance reports and downloadable backups", "Founder-priority onboarding support"],
} as const;

const priceEnvironmentKeys: Record<`${PaidBillingPlan}_${BillingInterval}`, string> = {
  collector_month: "STRIPE_COLLECTOR_MONTHLY_PRICE_ID",
  collector_year: "STRIPE_COLLECTOR_ANNUAL_PRICE_ID",
  pro_month: "STRIPE_PRO_MONTHLY_PRICE_ID",
  pro_year: "STRIPE_PRO_ANNUAL_PRICE_ID",
};

export function stripePriceId(plan: PaidBillingPlan, interval: BillingInterval, environment: Record<string, string | undefined> = process.env) {
  return environment[priceEnvironmentKeys[`${plan}_${interval}`]]?.trim() || undefined;
}

export function billingTestMode(environment: Record<string, string | undefined> = process.env) {
  return environment.STRIPE_BILLING_MODE?.trim().toLowerCase() === "test"
    && Boolean(environment.STRIPE_SECRET_KEY?.trim().startsWith("sk_test_"));
}

export function billingConfigured(environment: Record<string, string | undefined> = process.env) {
  return billingTestMode(environment)
    && Boolean(environment.STRIPE_WEBHOOK_SECRET?.trim())
    && (["collector", "pro"] as PaidBillingPlan[]).every(plan =>
      (["month", "year"] as BillingInterval[]).every(interval => stripePriceId(plan, interval, environment)),
    );
}

export function billingTesterAllowed(email: string | null | undefined, environment: Record<string, string | undefined> = process.env) {
  if (!email || !billingTestMode(environment)) return false;
  const allowed = (environment.STRIPE_BILLING_TESTER_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function planForStripePrice(priceId: unknown, environment: Record<string, string | undefined> = process.env): PaidBillingPlan | undefined {
  if (typeof priceId !== "string" || !priceId) return undefined;
  for (const plan of ["collector", "pro"] as PaidBillingPlan[]) {
    for (const interval of ["month", "year"] as BillingInterval[]) {
      if (stripePriceId(plan, interval, environment) === priceId) return plan;
    }
  }
  return undefined;
}

export function billingLabel(plan?: string | null, status?: string | null) {
  const name = plan === "collector" ? "Collector" : plan === "pro" ? "Pro" : plan === "concierge" ? "Concierge" : plan === "founder" ? "Founder" : undefined;
  if (name && ["active", "trialing"].includes(status || "")) return `${name} active`;
  if (name && status === "past_due") return `${name} · payment attention`;
  if (name && status === "canceled") return `${name} · canceled`;
  return "Free preview";
}

export function stripeHeaders(secret = process.env.STRIPE_SECRET_KEY) {
  if (!secret) throw new Error("Stripe billing is not configured");
  return { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" };
}

export function checkoutSessionGrantsAccess(session: { payment_status?: unknown; customer?: unknown; subscription?: unknown }) {
  if (!["paid", "no_payment_required"].includes(String(session.payment_status || ""))) return false;
  if (typeof session.customer !== "string" || !session.customer) return false;
  if (!session.subscription || typeof session.subscription !== "object") return false;
  const subscription = session.subscription as { id?: unknown; status?: unknown };
  if (typeof subscription.id !== "string" || !subscription.id) return false;
  return ["active", "trialing"].includes(String(subscription.status || ""));
}
