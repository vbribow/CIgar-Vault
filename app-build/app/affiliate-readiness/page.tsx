import { mobileCommercePolicy } from "@/lib/mobile-commerce-policy";
import "./affiliate-readiness.css";

export const dynamic = "force-dynamic";

const mobileGates = [
  ["Written store interpretation", "The exact experience is reviewed against current Apple and Google tobacco policies."],
  ["Non-transactional design", "Retailer identity or availability cannot become a purchase button, redirect, or disguised commerce route."],
  ["No affiliate tracking", "The mobile binary, API responses, notifications, and deep links contain no affiliate parameter or conversion tracking."],
  ["Independent ranking", "Compensation never changes search, evidence, price normalization, retailer scores, or guidance."],
  ["Legal and privacy review", "Age, jurisdiction, disclosure, data sharing, and retailer responsibilities are approved for the exact flow."],
  ["Founder release decision", "Brian separately approves the frozen mobile implementation after every other gate passes."],
] as const;

export default function AffiliateReadinessPage() {
  return <main className="shell wideShell affiliateReadinessPage">
    <section className="affiliateReadinessHero">
      <div><div className="eyebrow">Founder commercial boundary</div><h1>Affiliate commerce is web-only.</h1><p className="lede">The mobile collector application is research-only. It does not open tobacco purchase pages, decorate retailer URLs, track affiliate conversions, or route users to the separate web marketplace.</p><div className="ctaRow"><a className="button secondary" href="/trust">Review commercial independence</a><a className="button secondary" href="/launch-readiness">Review launch readiness</a></div></div>
      <aside><strong>Mobile blocked</strong><span>{mobileCommercePolicy.notice}</span></aside>
    </section>
    <section className="affiliateReadinessMetrics">
      <article><span>Mobile purchase links</span><strong>Off</strong><small>research observations only</small></article>
      <article><span>Mobile affiliate tracking</span><strong>Off</strong><small>no compensated redirect</small></article>
      <article><span>Web affiliate surface</span><strong>Separate</strong><small>fails closed until approved configuration</small></article>
      <article><span>Fox status</span><strong>Locked</strong><small>separate explicit approval required</small></article>
    </section>
    <section className="card affiliateGateMap"><div className="sectionHead"><div><div className="eyebrow">Possible future mobile path</div><h2>Every gate must pass before reconsideration.</h2><p>No result below can compensate for a failed store-policy, legal, privacy, or founder-approval gate.</p></div></div><div>{mobileGates.map(([title,detail],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><strong>{title}</strong><small>{detail}</small></article>)}</div></section>
    <section className="card affiliateEmptyState"><div className="eyebrow">Current implementation</div><h2>Research in the app. Commerce on the reviewed public web surface.</h2><p>Future mobile monetization should begin with subscriptions, premium collector services, or retailer software—not tobacco-sale commissions. Retailer commerce can be reconsidered only after written policy and attorney review of the exact experience.</p></section>
  </main>;
}
