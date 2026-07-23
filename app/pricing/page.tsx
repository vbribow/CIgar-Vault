import type { Metadata } from "next";
import { billingConfigured, founderPlan } from "@/lib/billing";
import { plans, type PlanId } from "@/lib/entitlements";
import { ProductEvent } from "@/components/product-event";
import "./pricing.css";
import "./tiers.css";

export const dynamic = "force-dynamic";
export const metadata:Metadata={
  title:"Cedriva Reserve",
  description:"Explore the deepest level of Cedriva intelligence, education, service, and collection stewardship.",
};

const featureLabels={
  "unlimited-inventory":"Unlimited inventory",
  "collections":"Collectible sets",
  "insurance-reports":"Insurance-ready reports",
  "valuation-research":"Valuation research",
  "professional-ratings":"Professional ratings",
  "climate-sensors":"Climate sensors",
  "automations":"Scheduled intelligence",
  "concierge-support":"White-glove support",
} as const;

export default async function PricingPage({searchParams}:{searchParams:Promise<{error?:string;recommended?:string}>}){
  const params=await searchParams;
  const configured=billingConfigured();
  const recommended=params.recommended as PlanId|undefined;
  const tiers:PlanId[]=["free","collector","pro","concierge"];
  return <main className="shell pricingPage">
    <ProductEvent eventType="pricing-viewed" properties={recommended?{recommended}:undefined}/>
    <section className="pricingHero"><div><div className="eyebrow">Cedriva Reserve · Depth when it becomes useful</div><h1>Start simply. Grow without limits.</h1><p className="lede">Cedriva recommends deeper service only when research, collection scale, climate care, or personal support makes it genuinely valuable.</p></div><div className="founderCount"><strong>25</strong><span>founder memberships</span><small>Complete access remains grandfathered.</small></div></section>
    {params.error&&<div className="pricingNotice error">{params.error}</div>}
    {recommended&&<div className="pricingNotice">Based on your recent collection activity, <strong>{plans[recommended]?.name||"the next plan"}</strong> may be useful. Nothing has been restricted.</div>}
    <section className="tierGrid">{tiers.map(id=>{const plan=plans[id];return <article className={`tierCard ${recommended===id?"recommended":""}`} key={id}>{recommended===id&&<b>Recommended</b>}<div className="eyebrow">{plan.name}</div><h2>{plan.positioning}</h2><div className="tierLimits"><span>{Number.isFinite(plan.inventoryLimit)?`${plan.inventoryLimit} inventory lots`:"Unlimited inventory"}</span><span>{Number.isFinite(plan.humidorLimit)?`${plan.humidorLimit} humidor${plan.humidorLimit===1?"":"s"}`:"Unlimited humidors"}</span></div><ul>{plan.features.map(feature=><li key={feature}>{featureLabels[feature]}</li>)}</ul><a className="button secondary" href={id==="free"?"/login?mode=signup":"/account"}>{id==="free"?"Start free":"Available after founder beta"}</a></article>})}</section>
    <section className="founderOffer"><div><div className="eyebrow">Grandfathered launch offer</div><h2>{founderPlan.name} · ${founderPlan.annualPrice}/{founderPlan.interval}</h2><p>Complete advanced capabilities plus white-glove onboarding for the first 25 collectors.</p></div><form action="/api/billing/checkout" method="post"><button className="button" disabled={!configured}>{configured?"Start Founder membership":"Stripe intentionally deferred"}</button></form></section>
    <section className="pricingTrust"><span>No surprise paywalls</span><span>Trust before monetization</span><span>Founder access grandfathered</span><span>Owner-controlled exports</span></section>
  </main>;
}
