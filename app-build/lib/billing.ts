export type BillingPlan = "free" | "founder";

export const founderPlan = {
  name: "Founder", annualPrice: 99, interval: "year",
  features: ["Unlimited cigar and collection records", "Professional ratings and valuation research", "Humidor climate monitoring and alerts", "Insurance reports and downloadable backups", "Founder-priority onboarding support"],
} as const;

export function billingConfigured(environment: Record<string, string | undefined> = process.env) { return Boolean(environment.STRIPE_SECRET_KEY?.trim() && environment.STRIPE_FOUNDER_PRICE_ID?.trim()); }
export function billingLabel(plan?: string | null, status?: string | null) { const name=plan==="collector"?"Collector":plan==="pro"?"Pro":plan==="concierge"?"Concierge":plan==="founder"?"Founder":undefined;if(name&&["active","trialing"].includes(status||""))return `${name} active`;if(name&&status==="past_due")return `${name} · payment attention`;if(name&&status==="canceled")return `${name} · canceled`;return "Free preview"; }
export function stripeHeaders(secret = process.env.STRIPE_SECRET_KEY) { if (!secret) throw new Error("Stripe billing is not configured"); return { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" }; }
