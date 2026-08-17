import type { Metadata } from "next";
import { TrustMark } from "@/components/trust-mark";
import { trustFramework } from "@/lib/trust-evidence";
import { brand } from "@/lib/brand";

export const metadata:Metadata={title:"Trust Center",description:`Understand how ${brand.name} distinguishes official information, historical evidence, expert knowledge, community experience, and AI-assisted guidance.`};

export default function TrustPage(){
  return <main className="shell trustPage">
    <section className="trustHero">
      <div><div className="eyebrow">The {brand.name} Trust Framework</div><h1>Know what you’re reading.</h1><p className="lede">Every meaningful claim should tell you where it came from, when it was observed, how confident {brand.name} is, and whether commercial influence is present.</p></div>
      <aside><strong>Trust is earned through clarity.</strong><p>Official does not mean infallible. Community does not mean unimportant. AI never becomes fact simply because it sounds certain.</p></aside>
    </section>
    <section className="trustDirectory">
      {trustFramework.map(item=><article data-level={item.kind} key={item.kind}>
        <TrustMark kind={item.kind}/>
        <div><h2>{item.kind}</h2><p>{item.description}</p><small>{item.question}</small></div>
      </article>)}
    </section>
    <section className="trustStandard">
      <div><div className="eyebrow">The evidence standard</div><h2>A label is the beginning—not the proof.</h2></div>
      <div><article><span>Source</span><strong>Who supplied the claim?</strong></article><article><span>Date</span><strong>When was it published or observed?</strong></article><article><span>Confidence</span><strong>How well does the evidence support it?</strong></article><article><span>Corrections</span><strong>What changed, and why?</strong></article></div>
    </section>
    <section className="trustPromise">
      <div><div className="eyebrow">Commercial independence</div><h2>Compensation never becomes evidence.</h2><p>Retailer compensation cannot change which listings are found, how results are ordered, the price shown, a valuation’s evidence status, or an editorial recommendation. When a link can compensate {brand.name}, that relationship is stated beside the link in plain language. Uncompensated links remain direct and untracked.</p></div>
      <div><strong>Affiliate activation requires:</strong><p>Documented terms, privacy and legal review, adult and jurisdiction controls, editorial-independence confirmation, and a separate founder launch approval. Incomplete or malformed configuration fails closed.</p></div>
    </section>
    <section className="trustPromise">
      <div><div className="eyebrow">Retailer data boundary</div><h2>A retailer may report availability. It cannot verify the cigar.</h2><p>Any future retailer-submitted identity, price, or stock observation must carry its source, observation date, review date, and commercial relationship. It remains separate from manufacturer evidence, collector provenance, authenticity work, completed-sale evidence, and valuation conclusions.</p></div>
      <div><strong>What a reviewed listing means:</strong><p>Only that the named retailer and dated observation passed the stated listing checks. It is not a universal seller endorsement, authenticity certificate, appraisal, or promise that inventory remains available.</p></div>
    </section>
    <section className="trustPromise">
      <div><div className="eyebrow">Utility before network effects</div><h2>Your private record does not depend on a feed.</h2><p>{brand.name} is collector intelligence rather than a tobacco marketplace or general social network. Core collection, provenance, climate, research, and valuation tools must remain useful without public posting, retailer participation, or community activity.</p></div>
    </section>
    <section className="trustPromise"><div><h2>Uncertainty belongs in the record.</h2><p>When sources disagree or evidence is incomplete, {brand.name} will say so. Collectors should be able to inspect the evidence and keep their own judgment.</p></div><div className="ctaRow"><a className="button" href="/discover">Explore trusted discovery</a><a className="button secondary" href="/data-model">See how records connect</a></div></section>
  </main>;
}
