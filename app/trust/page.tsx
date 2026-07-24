import type { Metadata } from "next";
import { TrustMark } from "@/components/trust-mark";
import { trustFramework } from "@/lib/trust-evidence";

export const metadata:Metadata={title:"Trust Center",description:"Understand how Cedriva distinguishes official information, historical evidence, expert knowledge, community experience, and AI-assisted guidance."};

export default function TrustPage(){
  return <main className="shell trustPage">
    <section className="trustHero">
      <div><div className="eyebrow">The Cedriva Trust Framework</div><h1>Know what you’re reading.</h1><p className="lede">Every meaningful claim should tell you where it came from, when it was observed, how confident Cedriva is, and whether commercial influence is present.</p></div>
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
    <section className="trustPromise"><div><h2>Uncertainty belongs in the record.</h2><p>When sources disagree or evidence is incomplete, Cedriva will say so. Collectors should be able to inspect the evidence and keep their own judgment.</p></div><div className="ctaRow"><a className="button" href="/discover">Explore trusted discovery</a><a className="button secondary" href="/data-model">See how records connect</a></div></section>
  </main>;
}
