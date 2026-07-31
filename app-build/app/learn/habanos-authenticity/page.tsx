import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import {
  HABANOS_AUTHENTICITY_URL,
  HABANOS_COUNTERFEIT_GUIDANCE_URL,
  HABANOS_EVIDENCE_CAUTION,
  HABANOS_RETAIL_NETWORK_URL,
  OFAC_CUBAN_GOODS_URL,
} from "@/lib/habanos-protection";

export const metadata: Metadata = {
  title: `Authentic Habanos | ${brand.name}`,
  description: "A layered collector workflow for legality, sourcing, package evidence, official lookup results, and provenance.",
};

const steps = [
  ["1 · Jurisdiction", "Confirm that buying, possessing, transporting, and importing the product is lawful for you. Authenticity does not make a transaction legal."],
  ["2 · Seller and channel", "Check the producer’s current authorized network. Preserve the seller name, listing URL, purchase date, jurisdiction, and receipt."],
  ["3 · Complete package", "Photograph the unopened box, seals, market marks, serial or barcode area, box code, hinges, interior, and the cigars before altering anything."],
  ["4 · Official lookup", "Run the producer’s current lookup and save its exact response, date, and a private screenshot or evidence link."],
  ["5 · Provenance", "Record custody, storage, condition, transfers, and unresolved conflicts. Loose cigars have a narrower evidence record than an intact presentation."],
] as const;

export default function HabanosAuthenticityPage() {
  return <main className="shell learnPage">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/verification">Verification ledger</a><a href="/inventory">Inventory</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Collector protection</div><h1>Reduce counterfeit risk with layered evidence.</h1><p className="lede">No seal, code, seller claim, or lookup result proves everything. Build a dated record that keeps legality, authenticity, condition, and provenance separate.</p><div className="ctaRow"><a className="button" href="/verification">Review Cuban lots</a><a className="button secondary" href={HABANOS_AUTHENTICITY_URL}>Open Habanos official lookup →</a></div><p className="sourceReturnNote">Official sources open in this tab. Use your browser’s Back button to return to {brand.name}.</p></div><aside><span>Evidence boundary</span><blockquote>{HABANOS_EVIDENCE_CAUTION}</blockquote><small>When evidence conflicts, preserve the conflict and leave the conclusion unresolved.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Before purchase</div><h2>Legality comes before authenticity.</h2><p>Rules depend on your location, route, citizenship, and transaction. For U.S. persons, review current U.S. Treasury guidance before buying or transporting Cuban-origin tobacco; do not rely on old travel advice.</p></div><a className="button secondary" href={OFAC_CUBAN_GOODS_URL}>Open current OFAC FAQ 769 →</a></div></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Layered workflow</div><h2>Preserve the record before asking for a verdict.</h2></div></div><div className="learningPathways">{steps.map(([label,title])=><article key={label}><span>{label}</span><p>{title}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Official sources</div><h2>Use the producer’s current tools directly.</h2><p>Habanos identifies counterfeiting as an active concern and directs buyers toward its authorized distribution and retail network. A retailer listing is still a starting point for due diligence—not an endorsement by {brand.name}.</p><div className="ctaRow"><a className="button secondary" href={HABANOS_RETAIL_NETWORK_URL}>Open authorized network →</a><a className="button secondary" href={HABANOS_COUNTERFEIT_GUIDANCE_URL}>Open counterfeit guidance →</a></div></section>
  </main>;
}
