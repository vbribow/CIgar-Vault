import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { factoryMapCountries, factoryMapQuestions, factoryRelationshipModels } from "@/lib/factory-map-study";
import { publicPageMetadata } from "@/lib/seo";
import "./factory-map-reading.css";

export const metadata: Metadata = publicPageMetadata(
  "How to Read a Cigar Factory Map",
  "Learn how brand ownership, blending, factories, contract production, country, and release-level evidence fit together.",
  "/learn/factory-map-reading",
);

export default function FactoryMapReadingPage() {
  const factoryCount = factoryMapCountries.reduce((total, group) => total + group.factories.length, 0);
  return <main className="shell factoryMapStudy">
    <section className="factoryMapHero">
      <div><div className="eyebrow">{brand.name} Learn · Factory map field guide</div><h1>A factory map begins the investigation. It does not finish it.</h1><p className="lede">The name on a cigar band may identify a brand owner, not the people and place that made the cigar. Use this guide to follow the relationship without turning a broad map into false precision.</p><div className="ctaRow"><a className="button" href="#source-atlas">Explore the source atlas</a><a className="button secondary" href="/learn/manufacturing-truth">Open verified manufacturing records</a></div></div>
      <aside><span>The collector&apos;s question</span><blockquote>Who made this exact cigar, at this moment in its history?</blockquote><p>Country, factory, line, vitola, market, and production period all matter.</p></aside>
    </section>

    <section className="mapSourceNote">
      <div><div className="eyebrow">Source used for this lesson</div><h2>Privada Cigar Club Factory Map · Version 1</h2></div>
      <div><p>The user-provided map organizes factories in Nicaragua, the Dominican Republic, Honduras, the United States, and Costa Rica, then lists brands reportedly made at each facility.</p><p><strong>Trust boundary:</strong> the map is undated and its relationships can change. Hojavía preserves it as a broad research lead. It does not independently verify a factory for a specific cigar, populate a collector record, or override a newer product-level source.</p></div>
    </section>

    <section className="relationshipLesson">
      <div className="factoryMapHeading"><div><div className="eyebrow">Three production relationships</div><h2>“Made by” can describe different kinds of work.</h2></div><p>The source uses a compact key. Hojavía expands those categories so the factory, brand, and people receive accurate credit.</p></div>
      <div className="relationshipCards">{factoryRelationshipModels.map((model, index) => <article key={model.name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{model.name}</h3><p>{model.meaning}</p><strong>Do not overread it</strong><p>{model.caution}</p></article>)}</div>
    </section>

    <section className="sourceAtlas" id="source-atlas">
      <div className="factoryMapHeading"><div><div className="eyebrow">Archival source atlas · {factoryCount} named facilities or factory systems</div><h2>Follow the factory network by country.</h2></div><p>Names below are transcribed from the supplied map for education and future research. They are not a current certification of every relationship shown in the original.</p></div>
      <div className="countryFactoryGrid">{factoryMapCountries.map((group) => <article key={group.country}><header><span>{group.factories.length} listed</span><h3>{group.country}</h3><p>{group.context}</p></header><ul>{group.factories.map((factory) => <li key={factory}>{factory}</li>)}</ul></article>)}</div>
    </section>

    <section className="mapReadingMethod">
      <div><div className="eyebrow">A six-question check</div><h2>Turn a map entry into a trustworthy cigar record.</h2><p>Each answer narrows a broad relationship toward the exact cigar in front of you.</p></div>
      <ol>{factoryMapQuestions.map((question, index) => <li key={question}><span>{String(index + 1).padStart(2, "0")}</span><p>{question}</p></li>)}</ol>
    </section>

    <section className="mapClosing">
      <div><div className="eyebrow">What the map teaches well</div><h2>Factories are part of the cigar&apos;s authorship.</h2></div>
      <div><p>A factory contributes tobacco access, fermentation knowledge, bunching and rolling teams, draw standards, finishing, rest, quality control, and institutional memory. Naming that work makes the cigar story more complete.</p><p>The disciplined next step is release-level evidence. Hojavía connects a factory only when the source supports the exact identity and time period; otherwise, the relationship remains visible as a research lead.</p><div className="ctaRow"><a className="button" href="/learn/manufacturing-truth#all-brands">Search manufacturing coverage</a><a className="button secondary" href="/catalog-discovery#research-backlog">Review unresolved research</a><a className="button secondary" href="/learn/blending">Meet blenders and factory teams</a></div></div>
    </section>
  </main>;
}
