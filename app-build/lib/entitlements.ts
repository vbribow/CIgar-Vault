export type PlanId = "free" | "collector" | "reserve" | "concierge" | "founder";
export type FeatureId =
  | "unlimited-inventory"
  | "collections"
  | "insurance-reports"
  | "valuation-research"
  | "professional-ratings"
  | "climate-sensors"
  | "automations"
  | "concierge-support"
  | "cigar-somm"
  | "live-research";

export type PlanDefinition = {
  name: string;
  positioning: string;
  monthlyPrice: number;
  annualPrice: number;
  inventoryLimit: number;
  humidorLimit: number;
  sensorLimit: number;
  monthlyAiCredits: number;
  providerCostCeilingCents: number;
  features: FeatureId[];
  benefits: string[];
};

export const plans: Record<PlanId, PlanDefinition> = {
  free: {
    name: "Free", positioning: "Begin a private, enduring collection record", monthlyPrice: 0, annualPrice: 0,
    inventoryLimit: 25, humidorLimit: 1, sensorLimit: 0, monthlyAiCredits: 5, providerCostCeilingCents: 15,
    features: ["collections", "cigar-somm"],
    benefits: ["25 inventory lots", "One humidor", "Smoke journal and collections", "Education, community, and owner-controlled export"],
  },
  collector: {
    name: "Collector", positioning: "Organize and protect a growing collection", monthlyPrice: 9.99, annualPrice: 99,
    inventoryLimit: Infinity, humidorLimit: 3, sensorLimit: 1, monthlyAiCredits: 30, providerCostCeilingCents: 100,
    features: ["unlimited-inventory", "collections", "insurance-reports", "valuation-research", "cigar-somm", "live-research"],
    benefits: ["Unlimited inventory", "Three humidors and one sensor", "Insurance-ready reporting and backups", "Valuation history and 30 intelligence credits monthly"],
  },
  reserve: {
    name: "Reserve", positioning: "Automate intelligence across a serious vault", monthlyPrice: 24.99, annualPrice: 249,
    inventoryLimit: Infinity, humidorLimit: Infinity, sensorLimit: Infinity, monthlyAiCredits: 150, providerCostCeilingCents: 400,
    features: ["unlimited-inventory", "collections", "insurance-reports", "valuation-research", "professional-ratings", "climate-sensors", "automations", "cigar-somm", "live-research"],
    benefits: ["Unlimited humidors and sensors", "Professional ratings and live research", "Cigar Somm and scheduled intelligence", "Alerts and 150 intelligence credits monthly"],
  },
  concierge: {
    name: "Concierge", positioning: "Personal collection stewardship", monthlyPrice: 99, annualPrice: 999,
    inventoryLimit: Infinity, humidorLimit: Infinity, sensorLimit: Infinity, monthlyAiCredits: 500, providerCostCeilingCents: 1500,
    features: ["unlimited-inventory", "collections", "insurance-reports", "valuation-research", "professional-ratings", "climate-sensors", "automations", "concierge-support", "cigar-somm", "live-research"],
    benefits: ["Everything in Reserve", "Assisted onboarding and record review", "Priority support and collection strategy", "500 intelligence credits monthly"],
  },
  founder: {
    name: "Founder", positioning: "Grandfathered Reserve-level platform access", monthlyPrice: 0, annualPrice: 99,
    inventoryLimit: Infinity, humidorLimit: Infinity, sensorLimit: Infinity, monthlyAiCredits: 150, providerCostCeilingCents: 400,
    features: ["unlimited-inventory", "collections", "insurance-reports", "valuation-research", "professional-ratings", "climate-sensors", "automations", "concierge-support", "cigar-somm", "live-research"],
    benefits: ["Grandfathered Reserve-level access", "Founder-priority onboarding", "150 intelligence credits monthly", "Owner-controlled records and exports"],
  },
};

export function normalizePlan(value?: string | null): PlanId {
  if (value === "pro") return "reserve"; // Preserve legacy accounts after the Reserve rename.
  return value && value in plans ? value as PlanId : "free";
}
export function hasEntitlement(plan: PlanId, feature: FeatureId) { return plans[plan].features.includes(feature); }
export function effectivePlan(value?: string | null, status?: string | null): PlanId {
  const plan = normalizePlan(value);
  if (plan === "free") return plan;
  return status === "active" || status === "trialing" ? plan : "free";
}
export type UpgradeContext = "inventory" | "reports" | "ratings" | "sensors";
export type CollectorSignals = { lotCount?: number; portfolioValue?: number; humidorCount?: number; collectionCount?: number };
export function collectorProfile(signals: CollectorSignals = {}) {
  if ((signals.portfolioValue || 0) >= 100000 || (signals.lotCount || 0) >= 200) return "estate" as const;
  if ((signals.portfolioValue || 0) >= 25000 || (signals.lotCount || 0) >= 75 || (signals.humidorCount || 0) >= 3 || (signals.collectionCount || 0) >= 5) return "established" as const;
  return "developing" as const;
}
export function upgradeSuggestion(plan: PlanId, context: UpgradeContext, usage = 0, signals: CollectorSignals = {}) {
  if (plan === "founder" || plan === "concierge") return undefined;
  const profile = collectorProfile({ ...signals, lotCount: signals.lotCount ?? (context === "inventory" ? usage : undefined) });
  if (plan === "reserve" && profile === "estate" && (context === "inventory" || context === "reports")) return { target: "concierge" as PlanId, title: "A vault of this scope may benefit from personal collection stewardship.", detail: "Concierge adds assisted onboarding, record review, and priority support without changing ownership of your data.", action: "Review Concierge" };
  if (context === "inventory" && plan === "free" && usage >= 20) return { target: "collector" as PlanId, title: profile === "developing" ? "Preserve the collection without an artificial ceiling." : "Give a collection of this caliber a complete, enduring record.", detail: `${usage} documented lots · Collector adds unlimited inventory, evidence-backed values, and insurance-ready reporting.`, action: "Review Collector" };
  if (context === "reports" && plan === "free") return { target: "collector" as PlanId, title: "Document the collection to an insurance-ready standard.", detail: "Collector preserves replacement value, provenance, and an exportable property schedule in one owner-controlled record.", action: "Review Collector" };
  if ((context === "ratings" || context === "sensors") && (plan === "free" || plan === "collector")) return { target: "reserve" as PlanId, title: context === "ratings" ? "Build a publication record around significant holdings." : "Protect condition across every storage environment.", detail: context === "ratings" ? "Reserve adds recurring, source-backed ratings and market research with manual approval before anything enters the vault." : "Reserve adds unlimited sensors, normalized history, discreet alerts, and scheduled synchronization.", action: "Review Reserve" };
  return undefined;
}
