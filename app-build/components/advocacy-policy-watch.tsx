import { brand } from "@/lib/brand";
import "./advocacy-policy-watch.css";

const sources = [
  {
    sourceType: "Advocacy organization",
    name: "Cigar Rights of America",
    summary: "CRA describes itself as a consumer-based advocacy organization representing adult premium-cigar interests. Its site tracks legislative activity and offers membership and advocacy actions.",
    caution: "This is CRA’s stated mission and policy position—not independent legal guidance or a conclusion endorsed by Hojavía.",
    href: "https://cigarrights.org/about-us/",
    action: "Review CRA’s stated mission",
  },
  {
    sourceType: "Government regulator",
    name: "U.S. Food and Drug Administration",
    summary: "FDA publishes federal tobacco-product information, regulatory notices, and current agency guidance concerning cigars and other tobacco products.",
    caution: "Rules, court orders, enforcement posture, and local requirements can change. Confirm the date, jurisdiction, and controlling text before relying on a summary.",
    href: "https://www.fda.gov/tobacco-products/products-ingredients-components/cigars-cigarillos-little-filtered-cigars",
    action: "Review current federal information",
  },
] as const;

export function AdvocacyPolicyWatch() {
  return <section className="advocacyPolicyWatch" aria-labelledby="advocacy-policy-title">
    <div className="sectionHead"><div><div className="eyebrow">Advocacy &amp; policy watch</div><h2 id="advocacy-policy-title">Understand the position. Then verify the rule.</h2><p>{brand.name} keeps advocacy claims, government sources, independent reporting, and enacted law visibly separate.</p></div><small>Sources reviewed August 6, 2026</small></div>
    <div className="advocacyPolicyGrid">{sources.map(source=><article key={source.name}><span>{source.sourceType}</span><h3>{source.name}</h3><p>{source.summary}</p><small>{source.caution}</small><a href={source.href} target="_blank" rel="noreferrer">{source.action} ↗</a></article>)}</div>
    <p className="sourceReturnNote">External sources open in a new tab so the Industry Hub remains available when you return. Hojavía does not direct political activity or provide legal advice.</p>
  </section>;
}
