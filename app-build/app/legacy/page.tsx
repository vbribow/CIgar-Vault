import type { Metadata } from "next";
import Link from "next/link";
import { loadActivities, loadCollections, loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { buildLegacyRecord } from "@/lib/legacy-record";
import { PrivateRecordExport } from "@/components/private-record-export";
import "./legacy.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Legacy Record",description:"Preserve the chronology, provenance, meaning, and continuity of a lifetime of premium cigar collecting."};

export default async function LegacyPage(){
  const[inventory,collections,valuations,activities]=await Promise.all([loadInventory(),loadCollections(),loadValuations(),loadActivities()]);
  const legacy=buildLegacyRecord(inventory,collections,valuations,activities);
  const inventoryById=new Map(inventory.map(item=>[item.inventoryId,item]));
  return <main className="shell wideShell legacyPage">
    <section className="legacyHero"><div><div className="eyebrow">Legacy Collector · Private record</div><h1>A collection is a life story.</h1><p className="lede">Preserve what entered the collection, why it mattered, how it was cared for, and the people and moments connected to it—so its meaning endures beyond a list of holdings.</p><div className="ctaRow"><a className="button" href="#timeline">Shape the timeline</a><a className="button secondary" href="#record">Strengthen the record</a></div></div><aside><strong>{legacy.readiness}%</strong><span>legacy record readiness</span><small>Identity, dates, photographs, provenance, and value evidence</small></aside></section>
    <section className="legacyMetrics"><article><strong>{legacy.totals.lots}</strong><span>documented lots</span></article><article><strong>{legacy.totals.cigars}</strong><span>cigars preserved</span></article><article><strong>{legacy.totals.collections}</strong><span>named collections</span></article><article><strong>{legacy.earliestYear&&legacy.latestYear?`${legacy.earliestYear}–${legacy.latestYear}`:"Developing"}</strong><span>documented release span</span></article></section>
    <section className="legacySplit" id="timeline"><div><div className="eyebrow">Collection chronology</div><h2>The record of a collection in motion.</h2><p>Purchases, gifts, smokes, moves, corrections, and other documented events form the factual backbone of the collection story.</p></div><div className="legacyTimeline">{legacy.timeline.length?legacy.timeline.map(event=>{const item=inventoryById.get(event.inventoryId);return <article key={event.activityId}><time>{event.eventDate}</time><div><strong>{event.eventType}</strong><small>{item?`${item.brand} ${item.line}`:event.inventoryId}</small>{event.notes&&<p>{event.notes}</p>}</div></article>}):<div className="emptyState">The timeline is ready for its first documented event.</div>}<Link className="textLink" href="/activity">Open the complete activity ledger →</Link></div></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Significant holdings</div><h2>The cigars and collections that carry the story.</h2><p className="small">Prioritized from collection membership, collector priority, and existing provenance—not assumed rarity.</p></div></div><div className="legacyHoldings">{legacy.significant.map(item=><Link href={`/inventory/${item.inventoryId}`} key={item.inventoryId}><span>{item.collectionName||item.priority||"Documented holding"}</span><h3>{item.brand} {item.line}</h3><p>{item.vitola}{item.vintage?` · ${item.vintage}`:""}</p><b>{item.provenanceNotes||item.provenanceDocumentLink?"Story started":"Add its story"} →</b></Link>)}</div></section>
    <section className="legacyRecord" id="record"><div><div className="eyebrow">Enduring record</div><h2>Make the collection understandable to someone else.</h2><p>Close the gaps that would otherwise leave identity, history, care, or value open to interpretation.</p><small>Cedriva preserves a collector record; legal, tax, insurance, and estate decisions should be reviewed with qualified professionals.</small></div><div className="legacyCoverage">{Object.entries(legacy.coverage).map(([key,value])=><Link href={key==="value"?"/valuations":key==="photo"||key==="provenance"?"/collection-health":"/inventory"} key={key}><span>{key}</span><strong>{value}%</strong><i><b style={{width:`${value}%`}}/></i></Link>)}</div><div className="legacyActions"><Link className="button" href="/reports">Prepare a protection report</Link><PrivateRecordExport/></div></section>
  </main>
}
