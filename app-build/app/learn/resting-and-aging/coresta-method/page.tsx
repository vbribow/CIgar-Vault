import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import "../resting-and-aging.css";

export const metadata: Metadata = publicPageMetadata(
  "Understanding the CORESTA conditioning method",
  "A plain-language explanation of what the CORESTA laboratory conditioning method supports—and what it does not establish for a collector humidor.",
  "/learn/resting-and-aging/coresta-method",
);

const sourceUrl = "https://www.coresta.org/sites/default/files/technical_documents/main/CRM_46-June2018.pdf";

export default function CorestaMethodPage() {
  return (
    <main className="shell restingAgingPage sourceGuidePage">
      <a className="sourceGuideBack" href="/learn/resting-and-aging#guidance">← Back to Hojavía aging guidance</a>

      <section className="restHero sourceGuideHero">
        <div>
          <div className="eyebrow">Technical source · explained by Hojavía</div>
          <h1>What the CORESTA conditioning method tells us.</h1>
          <p className="lede">CORESTA Recommended Method No. 46 describes a controlled atmosphere for conditioning cigars before laboratory testing. It is useful evidence about moisture equilibrium—not a universal instruction for storing a personal collection.</p>
        </div>
      </section>

      <section className="sourceGuideGrid" aria-label="CORESTA method interpretation">
        <article><span>What it supports</span><h2>Stable conditions matter.</h2><p>Temperature and relative humidity work together, and cigars need time to reach equilibrium before meaningful measurement.</p></article>
        <article><span>What it does not prove</span><h2>One perfect humidor setting.</h2><p>A laboratory test atmosphere is not automatically a flavor, aging, or long-term storage recommendation for every cigar.</p></article>
        <article><span>How Hojavía uses it</span><h2>Method evidence, clearly bounded.</h2><p>We use the source to explain conditioning and equilibrium while keeping collector guidance, maker guidance, and official Habanos standards distinct.</p></article>
      </section>

      <section className="card sourceGuideSource">
        <div><div className="eyebrow">Original evidence</div><h2>CORESTA Recommended Method No. 46</h2><p>The original document is hosted by CORESTA. Opening it may move you into your phone’s browser or PDF viewer; this Hojavía explanation will remain available for your return.</p></div>
        <a className="button secondary" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open original CORESTA PDF ↗</a>
      </section>
    </main>
  );
}
