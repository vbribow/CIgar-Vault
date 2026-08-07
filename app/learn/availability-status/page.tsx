import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Availability and product status | ${brand.name}`,
  description: "A collector guide to separating retail observations, portfolio evidence, market restrictions, discontinuation, revival, and scarcity.",
};

const layers = [
  ["Listing observation", "Seller, exact product identity, direct URL, observation time, stated availability, package quantity, and asking price."],
  ["Market context", "Country, eligible channel, shipping boundary, auction state, allocation, and whether the page is current or archived."],
  ["Product status", "Current portfolio, regular production, limited or one-time program, market-specific release, discontinued, revived, or unresolved."],
  ["Evidence", "Manufacturer or authorized-distributor source, publication date, effective period, exact wording, confidence, and conflicts."],
] as const;

export default function AvailabilityStatusPage() {
  return <main className="shell learnPage">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/wishlist">Wishlist</a><a href="/data-model">Data model</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Market evidence</div><h1>A listing is an observation—not a product verdict.</h1><p className="lede">In stock, sold out, waitlisted, auctioned, scarce, market-restricted, discontinued, and revived require different evidence. Preserve the seller’s claim without letting it rewrite the maker’s history.</p><div className="ctaRow"><a className="button" href="/wishlist">Review saved targets</a><a className="button secondary" href="/learn/release-chronology">Open chronology guide</a></div></div><aside><span>The safe inference</span><blockquote>No listings found means no qualifying listings were found in that search—not that the cigar no longer exists.</blockquote><small>Date every observation and preserve unresolved status.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Two connected timelines</div><h2>Keep seller observations separate from maker status.</h2></div></div><div className="learningPathways">{layers.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Before acting</div><h2>Confirm the direct page and your jurisdiction.</h2><p>Availability and price can change. A seller category or link is not an endorsement. Confirm exact identity, package quantity, condition, payment protections, age requirements, shipping eligibility, import rules, and authenticity evidence before purchasing.</p></section>
  </main>;
}
