import type { Metadata } from "next";
import { CollectorWalkthrough } from "@/components/collector-walkthrough";

export const metadata: Metadata = {
  title: "Synthetic Collector Walkthrough",
  description: "A private synthetic walkthrough of identity, acquisition, provenance, official verification evidence, uncertainty, and portable collection records.",
};

export default function CollectorWalkthroughPage() {
  return <main className="shell walkthroughPage">
    <section className="walkthroughHero">
      <div><div className="eyebrow">Private product walkthrough</div><h1>From acquisition to evidence.</h1><p className="lede">Follow one synthetic Habanos record through identity, acquisition, package evidence, an official-check state, a careful conclusion, and a portable export—without touching your collection.</p></div>
      <aside><strong>Records evidence</strong><span>Does not authenticate cigars</span><small>No real data · no persistence · no external submission</small></aside>
    </section>
    <CollectorWalkthrough />
    <section className="section card walkthroughBoundary"><div><div className="eyebrow">Public–private boundary</div><h2>The method can be shared. The collector record stays private.</h2></div><div><p>Public education explains sources, evidence states, and uncertainty. Prices, payment details, addresses, tracking, private correspondence, ownership, and storage locations remain private account data.</p><p>This walkthrough does not certify a product or seller, provide legal advice, or make a partner claim.</p></div></section>
  </main>;
}
