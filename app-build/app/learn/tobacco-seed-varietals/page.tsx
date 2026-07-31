import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Tobacco seed and varietals | ${brand.name}`,
  description: "Collector guidance for recording cigar tobacco cultivars, hybrids, lineage, growing location, leaf role, and producer claims without overstatement.",
};

const recordLayers = [
  ["Published name", "Keep the spelling, capitalization, language, and exact wording used by the producer, grower, breeder, or source."],
  ["Source-defined category", "Record whether the source calls it a cultivar, variety, line, hybrid, seed, ancestry, family, style, or leaves the category undefined."],
  ["Plant and place", "Keep breeder or seed authority, crop year, country, region, farm, field, and cultivation method in distinct fields."],
  ["Component scope", "Identify wrapper, binder, filler, whole blend, or product-name-only scope only when the evidence supports it."],
  ["Evidence state", "Attach the source, date, production period, confidence, conflicts, and whether the claim is producer-described, independently verified, or unresolved."],
] as const;

export default function TobaccoSeedVarietalsPage() {
  return <main className="shell learnPage">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/data-model">Data model</a><a href="/inventory">Inventory</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Plant identity</div><h1>Name the plant. Keep the claim attached.</h1><p className="lede">Seed identity, cultivar, hybrid, growing location, leaf role, and a name used in cigar marketing describe different things. Preserve each claim at the precision the evidence supports.</p><div className="ctaRow"><a className="button" href="/data-model">Open the identity model</a><a className="button secondary" href="/learn/seed-to-smoke">Follow the production journey</a></div></div><aside><span>The collector rule</span><blockquote>A familiar seed name is not a genetic certificate or a flavor guarantee.</blockquote><small>Unknown is a valid record when a producer keeps a cross proprietary or the source does not define its language.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Private record fields</div><h2>Separate the claim before comparing cigars.</h2><p>One product name can compress lineage, geography, style, and storytelling. Preserve the original language, then normalize only what a reliable source supports.</p></div></div><div className="learningPathways">{recordLayers.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Do not infer the experience</div><h2>Agronomy creates possibility—not a tasting verdict.</h2><p>Disease resistance, yield, field fit, plant position, curing, fermentation, blend architecture, construction, storage, and smoking conditions can all matter. Keep sensory notes attached to the cigar you observed; do not use them to authenticate genetics.</p><div className="ctaRow"><a className="button secondary" href="/learn/cigar-wrapper-colors">Separate wrapper color from flavor claims</a></div></section>
  </main>;
}
