import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import "../evidence-guides.css";

export const metadata:Metadata=publicPageMetadata("Understanding Cigar Dates","Separate announcement, release, production, collection, and acquisition dates without making a cigar older than the evidence proves.","/learn/release-chronology");

const dates=[
  ["Announcement date","When a maker first described the cigar publicly. It does not prove that boxes were already produced or available."],
  ["Release date","When sales or distribution began in a particular market. A release can arrive at different times in different places."],
  ["Production or box date","When the cigar or box was made, when that information is documented. This is the strongest starting point for cigar age."],
  ["Collection edition year","The year a presentation or assortment was released. Cigars inside may have different or earlier production histories."],
  ["Acquisition date","When the collector obtained the cigar. This documents ownership—not manufacture or age."],
] as const;

export default function ReleaseChronologyPage(){return <main className="shell evidenceGuide"><section className="evidenceGuideHero"><div><div className="eyebrow">Hojavía Learn · History</div><h1>One cigar can carry several dates. They do not mean the same thing.</h1><p className="lede">A trustworthy record keeps announcement, release, production, collection, and acquisition dates separate. When a date is unknown, “unknown” is more accurate than an assumption.</p></div><aside><strong>The essential rule</strong><p>A collection’s year never automatically becomes the production year of every cigar inside it.</p></aside></section><section className="evidenceGuideCards">{dates.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h2>{title}</h2><p>{body}</p></article>)}</section><section className="evidenceGuideDecision"><div><div className="eyebrow">How to document responsibly</div><h2>Record the date and what it actually proves.</h2></div><ol><li>Copy the exact date from the box, release notice, receipt, or other source.</li><li>Name the type of date instead of using a generic “year” field.</li><li>Keep the source with the fact.</li><li>Do not transfer a date from a collection to its component cigars without cigar-level evidence.</li><li>Correct the record openly when better evidence appears.</li></ol><div className="ctaRow"><a className="button" href="/learn/resting-and-aging">Understand resting and aging</a><a className="button secondary" href="/industry/registry">Explore the release registry</a></div></section></main>}
