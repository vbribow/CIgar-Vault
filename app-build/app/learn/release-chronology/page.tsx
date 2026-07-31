import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Release chronology | ${brand.name}`,
  description: "Keep cigar identity, edition programs, production periods, market releases, packaging states, and collector events distinct.",
};

const fields = [
  ["Product identity", "Brand, line or series, commercial vitola, factory vitola when sourced, and dimensions."],
  ["Program", "Regular range, Limited Edition, Regional Edition, channel exclusive, commemorative release, reserva, or another maker-defined category."],
  ["Event", "Announcement, presentation, launch, first market arrival, manufacture, box packing, acquisition, or collector receipt."],
  ["Time and market", "Exact date, year, or range at the precision supported, plus geography, distributor, or eligible channel."],
  ["Version evidence", "Factory, blend scope, band, packaging, box code, source, confidence, and effective period."],
] as const;

export default function ReleaseChronologyPage() {
  return <main className="shell learnPage">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/data-model">Data model</a><a href="/inventory">Inventory</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Collector chronology</div><h1>Date the event. Preserve the version.</h1><p className="lede">A product, edition, announcement, launch, box date, purchase, and arrival can carry different dates. Keep them connected without collapsing them into one “vintage.”</p><div className="ctaRow"><a className="button" href="/data-model">Open the identity model</a><a className="button secondary" href="/inventory">Review collection records</a></div></div><aside><span>The record rule</span><blockquote>A later fact adds a new state. It does not silently erase the earlier one.</blockquote><small>Unknown is safer than false precision.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Private record fields</div><h2>Build one event at a time.</h2><p>Preserve exact seller language and original evidence. Keep private receipts, correspondence, costs, box photographs, and custody inside your collector record.</p></div></div><div className="learningPathways">{fields.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Do not overstate status</div><h2>Absence is not proof of discontinuation.</h2><p>A cigar missing from a current portfolio, distributor page, or retailer shelf may be delayed, market-limited, between shipments, renamed, archived, or unresolved. Record the observation date and source until stronger evidence establishes the status.</p></section>
  </main>;
}
