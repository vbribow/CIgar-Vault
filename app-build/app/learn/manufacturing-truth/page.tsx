import type { Metadata } from "next";
import { ManufacturingCoverageIndex, ManufacturingTruthDirectory } from "@/components/manufacturing-truth-directory";
import { allBrandManufacturingCoverage, manufacturingFactories, manufacturingRegions, manufacturingTruthRecords } from "@/lib/manufacturing-truth";
import { brandCoverageWithCatalog } from "@/lib/brand-research";
import { getCatalog } from "@/lib/smartsheet";
import { dataMode } from "@/lib/config";
import "./manufacturing-truth.css";

export const metadata: Metadata = {
  title: "Who Actually Makes the Cigar?",
  description: "Follow premium cigar authorship from brand owner and blender to the actual factory, production relationship, tobacco regions, release history, and supporting evidence.",
};

const identityLayers = [
  ["Brand owner", "Owns or stewards the commercial name. Ownership does not prove who blended or manufactured the cigar."],
  ["Blender and tobacco team", "Defines or helps realize the sensory and technical direction. Authorship may be collaborative."],
  ["Actual factory", "Processes, bunches, rolls, finishes, rests, and quality-checks the cigar. This is the manufacturing truth Cedriva records."],
  ["Release", "Pins the relationship to a product, vitola, market, and date so later factory changes do not rewrite history."],
  ["Provenance", "Preserves the sources, confidence, corrections, and chain of custody behind each claim."],
] as const;

export const dynamic = "force-dynamic";

export default async function ManufacturingTruthPage() {
  let coverage = allBrandManufacturingCoverage;
  if (dataMode() !== "mock") {
    try { coverage = brandCoverageWithCatalog(await getCatalog()); } catch { coverage = allBrandManufacturingCoverage; }
  }
  return <main className="shell manufacturingTruthPage">
    <section className="truthHero">
      <div><div className="eyebrow">Cedriva Learn · Manufacturing Truth</div><h1>The name on the band is only the beginning.</h1><p className="lede">Collectors deserve to know who owned the idea, who shaped the blend, which factory made the cigar, where the tobacco came from, and how confidently each fact is known.</p><div className="ctaRow"><a className="button" href="#all-brands">Search every brand</a><a className="button secondary" href="#directory">Open deep records</a></div></div>
      <aside><span>The Cedriva rule</span><blockquote>Credit every hand the evidence allows us to name.</blockquote><p>A partner factory is not a footnote. Contract production is not a secret by definition. Uncertainty is not failure when it is stated honestly.</p></aside>
    </section>

    <section className="truthPremise" id="how-to-read">
      <div><div className="eyebrow">Five connected identities</div><h2>“Who makes it?” has more than one truthful answer.</h2><p>A cigar can be owned by one company, directed by another person, manufactured by a partner factory, use tobacco from several countries, and change factories in a later release. Cedriva keeps those identities separate and connected.</p></div>
      <ol>{identityLayers.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol>
    </section>

    <section className="truthTrustStandard">
      <div><div className="eyebrow">The Cedriva Trust Framework</div><h2>Evidence remains visible.</h2></div>
      <div className="truthLevels">
        <article data-level="Official"><span>Level 1</span><strong>Official</strong><p>Provided directly by a manufacturer or brand owner and identified as an official company claim.</p></article>
        <article data-level="Verified Historical"><span>Level 2</span><strong>Verified Historical</strong><p>Supported by attributable trade records, direct interviews, or multiple credible sources.</p></article>
        <article><span>Release rule</span><strong>Never overgeneralize</strong><p>A factory confirmed for one line, vitola, year, or market is not automatically credited to the entire brand.</p></article>
      </div>
    </section>

    <section className="coverageSection" id="all-brands">
      <div className="truthSectionHead"><div><div className="eyebrow">Complete Cedriva brand universe · {coverage.length} records</div><h2>No cigar disappears because its factory is unknown.</h2></div><p>Every premium brand currently represented in Cedriva has a manufacturing record. Founder-approved discoveries join this index automatically. Verified factories are named; unresolved factories remain visible as research work—not empty space and never a guess.</p></div>
      <ManufacturingCoverageIndex records={coverage} />
    </section>

    <section className="truthDirectorySection" id="directory">
      <div className="truthSectionHead"><div><div className="eyebrow">Deep manufacturing systems · {manufacturingTruthRecords.length} verified records</div><h2>Follow the cigar beyond the label.</h2></div><p>These records have enough evidence to connect ownership, creative authorship, actual production, history, and a release-level rule. They supply manufacturing truth to every matching cigar in Cedriva’s live catalog.</p></div>
      <ManufacturingTruthDirectory records={manufacturingTruthRecords} />
    </section>

    <section className="factoryAtlas" id="factories">
      <div className="truthSectionHead"><div><div className="eyebrow">Factory index</div><h2>Factories are authors, not invisible vendors.</h2></div><p>A factory contributes its people, leaf library, fermentation practice, construction systems, quality standards, and institutional memory.</p></div>
      <div>{manufacturingFactories.map((factory) => <a href={`#${factory.record}`} key={factory.name}><span>{factory.country}</span><h3>{factory.name}</h3><p>{factory.brands.join(" · ")}</p><strong>Open connected record ↓</strong></a>)}</div>
    </section>

    <section className="regionAtlas" id="regions">
      <div className="truthSectionHead"><div><div className="eyebrow">Tobacco geography</div><h2>Country is context. Region is closer. The lot is truth.</h2></div><p>These regional notes orient a collector without turning geography into a flavor stereotype.</p></div>
      <div>{manufacturingRegions.map(([name, body], index) => <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{name}</h3><p>{body}</p></article>)}</div>
    </section>

    <section className="truthMethod" id="research-standard">
      <div><div className="eyebrow">How Cedriva protects the record</div><h2>Corrections strengthen trust.</h2></div>
      <div><p>Each manufacturing claim carries a source type, confidence level, and verification date. When production changes, Cedriva preserves the previous relationship by release period rather than silently replacing it.</p><p>A brand-level factory is only inherited by a cigar when the evidence supports that relationship. A line, vitola, release year, or market exception can override it. When a factory is undisclosed, disputed, or supported only by indirect evidence, the record says so. Accuracy comes before completeness.</p><div className="ctaRow"><a className="button" href="/catalog">Review detailed cigars</a><a className="button secondary" href="/catalog-discovery#research-backlog">Open research backlog</a><a className="button secondary" href="/learn/blending#profiles">Meet the blenders</a></div></div>
    </section>
  </main>;
}
