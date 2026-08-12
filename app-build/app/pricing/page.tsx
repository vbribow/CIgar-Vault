import type { Metadata } from "next";
import { billingConfigured, founderPlan, type BillablePlanId, type BillingInterval } from "@/lib/billing";
import { plans, normalizePlan, type PlanId } from "@/lib/entitlements";
import { ProductEvent } from "@/components/product-event";
import "./pricing.css";
import "./tiers.css";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `${brand.name} Membership`, description: `Choose the level of ${brand.name} intelligence and collection stewardship that fits your vault.` };
const tiers: PlanId[] = ["free", "collector", "reserve", "concierge"];

function CheckoutButton({ plan, interval }: { plan: BillablePlanId; interval: BillingInterval }) {
  const ready = billingConfigured(plan, interval);
  return <form action="/api/billing/checkout" method="post">
    <input type="hidden" name="plan" value={plan} /><input type="hidden" name="interval" value={interval} />
    <button className="button secondary" disabled={!ready}>{ready ? `Choose ${interval}` : "Prepared for launch"}</button>
  </form>;
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ error?: string; recommended?: string }> }) {
  const params = await searchParams;
  const recommended = params.recommended ? normalizePlan(params.recommended) : undefined;
  return <main className="shell pricingPage">
    <ProductEvent eventType="pricing-viewed" properties={recommended ? { recommended } : undefined} />
    <section className="pricingHero"><div><div className="eyebrow">{brand.name} membership · hospitality at every level</div><h1>Begin freely. Choose deeper service only when it earns its place.</h1><p className="lede">Every membership protects the collector’s ownership of their records. Paid levels add scale, intelligence, and service—with a clear monthly allowance and no surprise AI overages.</p></div><div className="founderCount"><strong>25</strong><span>founder memberships</span><small>Reserve-level access remains grandfathered.</small></div></section>
    {params.error && <div className="pricingNotice error">{params.error}</div>}
    {recommended && recommended !== "free" && <div className="pricingNotice">Based on your collection activity, <strong>{plans[recommended].name}</strong> may be useful. Nothing has been changed automatically.</div>}
    <section className="tierGrid">{tiers.map(id => { const plan = plans[id]; return <article className={`tierCard ${recommended === id ? "recommended" : ""}`} key={id}>
      {recommended === id && <b>Recommended</b>}<div className="eyebrow">{plan.name}</div><h2>{plan.positioning}</h2>
      <div className="tierLimits"><span>{id === "free" ? "$0" : `$${plan.monthlyPrice}/month`}</span>{id !== "free" && <span>${plan.annualPrice}/year</span>}<span>{plan.monthlyAiCredits} intelligence credits/month</span></div>
      <ul>{plan.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
      {id === "free" ? <a className="button" href="/login?mode=signup">Create free account</a> : <div className="ctaRow"><CheckoutButton plan={id} interval="monthly" /><CheckoutButton plan={id} interval="annual" /></div>}
    </article>; })}</section>
    <section className="founderOffer"><div><div className="eyebrow">Grandfathered launch offer</div><h2>{founderPlan.name} · ${founderPlan.annualPrice}/{founderPlan.interval}</h2><p>Reserve-level platform access plus founder-priority onboarding for the first 25 collectors. Ongoing human concierge work is not unlimited.</p></div><CheckoutButton plan="founder" interval="annual" /></section>
    <section className="card"><div className="eyebrow">Intelligence credits</div><h2>Useful research, visibly controlled.</h2><p>Cached and local results use no credits. Cigar Somm uses 1 credit; exact live cigar or valuation research uses 5; an approved deep multi-source project uses 10. Live work pauses at the allowance instead of creating an unexpected charge.</p></section>
    <section className="pricingTrust"><span>No surprise overages</span><span>Free account remains useful</span><span>Founder access grandfathered</span><span>Owner-controlled exports</span></section>
  </main>;
}
