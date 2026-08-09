import type { Metadata } from "next";
import { CollectorWalkthrough } from "@/components/collector-walkthrough";

export const metadata: Metadata = {
  title: "Collector Record Practice Guide",
  description: "A private practice guide for recording a cigar, its purchase history, package photos, and an official lookup without changing your Vault.",
};

export default function CollectorWalkthroughPage() {
  return <main className="shell walkthroughPage">
    <section className="walkthroughHero">
      <div><div className="eyebrow">Private practice guide</div><h1>Record what you know. Keep questions visible.</h1><p className="lede">Practice with an example Habanos box: record the cigar, purchase, package photos, and official lookup, then see what those details do—and do not—confirm. Your Vault is never changed.</p></div>
      <aside><strong>Practice example</strong><span>Does not authenticate cigars</span><small>No real purchase · nothing saved · nothing submitted</small></aside>
    </section>
    <CollectorWalkthrough />
    <section className="section card walkthroughBoundary"><div><div className="eyebrow">Your privacy</div><h2>The guidance can be shared. Your collection details stay private.</h2></div><div><p>Hojavía can explain how to check a source and record an unanswered question. Your prices, payment details, addresses, messages, ownership, and storage locations remain private.</p><p>This guide does not certify a product or seller and does not provide legal advice.</p></div></section>
  </main>;
}
