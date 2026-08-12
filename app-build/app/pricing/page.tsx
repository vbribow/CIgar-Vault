import type { Metadata } from "next";
import { billingConfigured, founderPlan, type BillablePlanId, type BillingInterval } from "@/lib/billing";
import { plans, normalizePlan, type PlanId } from "@/lib/entitlements";
import { ProductEvent } from "@/components/product-event";
import "./pricing.css";
import "./tiers.css";
import { brand } from "@/lib/brand";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { loadReserveTrialEligibility, RESERVE_TRIAL_DAYS, RESERVE_TRIAL_OFFER, type ReserveTrialEligibility } from "@/lib/reserve-trial";

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

function ReserveTrialButton({ eligibility }: { eligibility?: ReserveTrialEligibility }) {
  if (!eligibility) return <a className="button" href="/login?next=%2Fpricing">Sign in to check trial access</a>;
  const ready = billingConfigured("reserve", "monthly");
  return <div><form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value="reserve" /><input type="hidden" name="interval" value="monthly" /><input type="hidden" name="offer" value={RESERVE_TRIAL_OFFER} /><button className="button" disabled={!eligibility.eligible || !ready}>{eligibility.eligible && ready ? `Start ${RESERVE_TRIAL_DAYS}-day Reserve trial` : eligibility.eligible ? "Trial prepared for launch" : "Reserve trial unlocks after value"}</button></form><small>{eligibility.reason}</small></div>;
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ error?: string; recommended?: string }> }) {
  const params = await searchParams;
  const recommended = params.recommended ? normalizePlan(params.recommended) : "reserve";
  let trialEligibility: ReserveTrialEligibility | undefined;
  if (supabaseConfigured()) { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (user) trialEligibility = await loadReserveTrialEligibility(supabase, user.id); }
  return <main className="shell pricingPage">
    <ProductEvent eventType="pricing-viewed" properties={recommended ? { recommended } : undefined} />
    <section className="pricingHero"><div><div className="eyebrow">{brand.name} membership · hospitality at every level</div><h1>Begin freely. Choose deeper service only when it earns its place.</h1><p className="lede">Every membership protects the collector’s ownership of their records. Paid levels add scale, intelligence, and service—with a clear monthly allowance and no surprise AI overages.</p></div><div className="founderCount"><strong>25</strong><span>founder memberships</span><small>Reserve-level access remains grandfathered.</small></div></section>
    {params.error && <div className="pricingNotice error">{params.error}</div>}
    {recommended && recommended !== "free" && <div className="pricingNotice">Based on your collection activity, <strong>{plans[recommended].name}</strong> may be useful. Nothing has been changed automatically.</div>}
    <section className="tierGrid">{tiers.map(id => { const plan = plans[id]; return <article className={`tierCard ${recommended === id ? "recommended" : ""}`} key={id}>
      {recommended === id && <b>{id === "reserve" ? "Recommended for serious collectors" : "Recommended"}</b>}<div className="eyebrow">{plan.name}</div><h2>{plan.positioning}</h2>
      <div className="tierLimits"><span>{id === "free" ? "$0" : `$${plan.monthlyPrice}/month`}</span>{id !== "free" && <span>${plan.annualPrice}/year</span>}<span>{plan.monthlyAiCredits} intelligence credits/month</span></div>
      <ul>{plan.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
      {id === "free" ? <a className="button secondary" href="/login?mode=signup">Continue with Free</a> : <div className="ctaRow"><CheckoutButton plan={id} interval="monthly" /><CheckoutButton plan={id} interval="annual" />{id === "reserve" && <ReserveTrialButton eligibility={trialEligibility} />}</div>}
    </article>; })}</section>
    <section className="founderOffer"><div><div className="eyebrow">Grandfathered launch offer</div><h2>{founderPlan.name} · ${founderPlan.annualPrice}/{founderPlan.interval}</h2><p>Reserve-level platform access plus founder-priority onboarding for the first 25 collectors. Ongoing human concierge work is not unlimited.</p></div><CheckoutButton plan="founder" interval="annual" /></section>
    <section className="card"><div className="eyebrow">Intelligence credits</div><h2>Useful research, visibly controlled.</h2><p>Cached and local results use no credits. Cigar Somm uses 1 credit; exact live cigar or valuation research uses 5; an approved deep multi-source project uses 10. Live work pauses at the allowance instead of creating an unexpected charge.</p></section>
    <section className="card"><div className="eyebrow">Why the trial is earned</div><h2>Experience Reserve when it can prove something useful.</h2><p>After three documented lots and either a smoke log or supported valuation, an eligible Free collector may begin one {RESERVE_TRIAL_DAYS}-day Reserve trial. The trial requires a payment method, shows the renewal price before confirmation, and can be canceled before billing. Free remains available without a card.</p></section>
    <section className="pricingTrust"><span>No surprise overages</span><span>Free account remains useful</span><span>Founder access grandfathered</span><span>Owner-controlled exports</span></section>
  </main>;
}
