import type { Metadata } from "next";
import { billingConfigured, publicPricing } from "@/lib/billing";
import { plans, type PlanId } from "@/lib/entitlements";
import { ProductEvent } from "@/components/product-event";
import "./pricing.css";
import "./tiers.css";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata:Metadata={
  title:`${brand.name} Reserve`,
  description:`Explore the deepest level of ${brand.name} intelligence, education, service, and collection stewardship.`,
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
  const testCheckout=billingConfigured();
  const recommended=params.recommended as PlanId|undefined;
  const tiers=["free","collector","pro"] as const;
  return <main className="shell pricingPage">
    <ProductEvent eventType="pricing-viewed" properties={recommended?{recommended}:undefined}/>
    <section className="pricingHero"><div><div className="eyebrow">{brand.name} Reserve · Depth when it becomes useful</div><h1>Start simply. Grow without limits.</h1><p className="lede">Every new collector receives 30 days of full access while the service stabilizes. Choose the depth of stewardship that remains useful after that.</p></div><div className="founderCount"><strong>30</strong><span>days of full access</span><small>Billing remains paused during stabilization.</small></div></section>
    {params.error&&<div className="pricingNotice error">{params.error}</div>}
    {recommended&&<div className="pricingNotice">Based on your recent collection activity, <strong>{plans[recommended]?.name||"the next plan"}</strong> may be useful. Nothing has been restricted.</div>}
    <section className="tierGrid">{tiers.map(id=>{const plan=plans[id],price=publicPricing[id];return <article className={`tierCard ${recommended===id?"recommended":""}`} key={id}>{recommended===id&&<b>Recommended</b>}<div className="eyebrow">{plan.name}</div><h2>{plan.positioning}</h2><div className="planPrice"><strong>{price.monthlyPrice===0?"$0":`$${price.monthlyPrice}`}</strong><span>{price.monthlyPrice===0?"forever":"per month"}</span></div>{price.monthlyPrice>0&&<p>or ${price.annualPrice}/year · save ${price.annualSavings}</p>}<div className="tierLimits"><span>{Number.isFinite(plan.inventoryLimit)?`${plan.inventoryLimit} inventory lots`:"Unlimited inventory"}</span><span>{Number.isFinite(plan.humidorLimit)?`${plan.humidorLimit} humidor${plan.humidorLimit===1?"":"s"}`:"Unlimited humidors"}</span></div><ul>{plan.features.map(feature=><li key={feature}>{featureLabels[feature]}</li>)}</ul>{id==="free"?<a className="button secondary" href="/login?mode=signup">Start free</a>:testCheckout?<div className="checkoutChoices"><form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value={id}/><input type="hidden" name="interval" value="month"/><button className="button secondary">Test monthly checkout</button></form><form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value={id}/><input type="hidden" name="interval" value="year"/><button className="button secondary">Test annual checkout</button></form></div>:<a className="button secondary" href="/account">Plans available after acceptance</a>}</article>})}</section>
    <section className="founderOffer"><div><div className="eyebrow">Billing status</div><h2>{testCheckout?"Stripe test checkout is ready for approved accounts.":"Pricing is set. Checkout is not active."}</h2><p>Collector and Pro subscriptions will open only after billing, legal, support, and entitlement acceptance gates pass. Test mode never creates a live charge.</p></div></section>
    <section className="pricingTrust"><span>No surprise paywalls</span><span>30 days of full access</span><span>Owner-controlled exports</span><span>Existing records remain accessible</span></section>
  </main>;
}
