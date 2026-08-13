import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EvidenceLabel } from "@/components/evidence-label";
import { cigarAdvisorHref } from "@/lib/cigar-advisor-links";
import { buildCigarStory } from "@/lib/cigar-story";
import { loadCollections, loadRatings, loadSmokingLogs, loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { canonicalCatalogHref } from "@/lib/canonical-cigar-record";
import { inventoryCollectionRelationships, isPresentationInventoryRecord } from "@/lib/collection-presentation";
import { SmokingExperienceScorecardView } from "@/components/smoking-experience-scorecard";
import { buildSmokingExperienceScorecards } from "@/lib/smoking-scorecard";
import { exactMarketMovement } from "@/lib/market-movement";
import "./story.css";

export const dynamic = "force-dynamic";
const money = (value: number | undefined) => value === undefined ? "Not yet documented" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default async function UnifiedCigarStoryPage({ params }: { params: Promise<{ identityId: string }> }) {
  const { identityId } = await params;
  const [inventory, valuations, smokes, ratings, collections] = await Promise.all([
    loadInventory(), loadValuations(), loadSmokingLogs(), loadRatings(), loadCollections(),
  ]);
  const story = buildCigarStory({ identityId, inventory, valuations, smokes, ratings, collections });
  if (!story) notFound();
  const representative = story.lots[0];
  const smokingScorecards = buildSmokingExperienceScorecards(representative, inventory, smokes);
  const movement=exactMarketMovement(story.valuations);
  const relationship=inventoryCollectionRelationships(inventory,collections).get(representative.inventoryId);
  if(relationship?.kind==="presentation"&&relationship.collection){
    redirect(`/collections/${encodeURIComponent(relationship.collection.collectionId)}`);
  }
  if(isPresentationInventoryRecord(representative,collections))redirect("/collections");
  return <main className="shell cigarStoryPage">
    <section className="unifiedStoryHero">
      <div>
        <div className="eyebrow">Cigar Story · {story.identity.identityId}</div>
        <h1>{story.identity.brand}</h1>
        <p>{story.identity.line}</p>
        <span>{story.identity.vitola}{story.identity.release ? ` · ${story.identity.release}` : ""}</span>
        <div className="ctaRow"><Link className="button" href={cigarAdvisorHref(representative)}>Ask Cigar Somm</Link><Link className="button secondary" href={`/records?inventoryId=${encodeURIComponent(representative.inventoryId)}`}>Log a smoke</Link></div>
      </div>
      <aside><span>Identity confidence</span><strong>{story.confidence}</strong><small>{story.sourceCount} linked source{story.sourceCount === 1 ? "" : "s"} · {story.lots.length} owned lot{story.lots.length === 1 ? "" : "s"}</small></aside>
    </section>

    <EvidenceLabel evidence={{ kind: "Official", sourceName: story.sourceCount ? "Connected source evidence" : "Collector identity record", confidence: story.confidence === "High" ? "High" : story.confidence === "Medium" ? "Medium" : "Unrated", supports: "Canonical identity, owned lots, price evidence, reviews, and personal journal context", commercialInfluence: "None disclosed" }} />

    <section className="storyMetrics">
      <article><span>Owned</span><strong>{story.quantity}</strong><small>Across {story.lots.length} lot{story.lots.length === 1 ? "" : "s"}</small></article>
      <article><span>Retail replacement</span><strong>{money(story.retailUnit)}</strong><small>Per cigar · lot {money(story.retailLotValue)}</small></article>
      <article><span>Market context</span><strong>{money(story.marketUnit)}</strong><small>Per cigar · estimate, not a sale</small></article>
      <article><span>Last verified sale</span><strong>{money(story.completedSale?.lastSaleValue)}</strong><small>{story.completedSale?.lastSaleDate || "No completed-sale proof"}</small></article>
      <article><span>Your experience</span><strong>{story.personalAverage ?? "—"}</strong><small>{story.smokes.length} journal entr{story.smokes.length === 1 ? "y" : "ies"}</small></article>
      <article><span>Published reviews</span><strong>{story.publishedAverage ?? "—"}</strong><small>{story.ratings.length} sourced score{story.ratings.length === 1 ? "" : "s"}</small></article>
    </section>
    <section className="marketMovementSummary" data-direction={movement.direction}><div><div className="eyebrow">Exact-identity market movement</div><h2>{movement.direction==="Developing"?"A trend is still developing.":`${movement.direction}${movement.changePercent===undefined?"":` · ${Math.abs(movement.changePercent)}%`}`}</h2><p>{movement.summary}</p></div><aside><strong>{movement.confidence}</strong><span>{movement.observationCount} dated observation{movement.observationCount===1?"":"s"}</span><small>{movement.sourceCount} linked source{movement.sourceCount===1?"":"s"} · asking prices and completed sales remain separate</small></aside></section>

    <section className="section card storyChapter"><div><div className="eyebrow">The cigar in your collection</div><h2>One identity, every connected chapter.</h2><p>{representative.provenanceNotes || representative.notes || `This ${story.identity.vitola} is preserved as part of your private collector record. Add the people, place, acquisition, or occasion behind it to preserve why it matters.`}</p></div><div className="storyActions"><Link href={canonicalCatalogHref(representative.catalogId || story.identity.identityId)}>Open canonical record <b>→</b></Link><Link href={`/inventory/${representative.inventoryId}`}>Document provenance <b>→</b></Link><Link href={`/valuations?inventoryId=${representative.inventoryId}`}>Research value <b>→</b></Link><Link href={`/learn`}>Learn with context <b>→</b></Link></div></section>

    <section className="storyColumns">
      <article className="section card"><div className="eyebrow">Owned lots</div><h2>{story.lots.length} connected</h2>{story.lots.map(item => <Link className="storyRow" href={item.packaging?`/inventory/${item.inventoryId}`:`/inventory?vaultSearch=${encodeURIComponent(item.inventoryId)}&edit=${encodeURIComponent(item.inventoryId)}&focus=packaging#inventory-editor`} key={item.inventoryId}><span><strong>{item.inventoryId}</strong><small>{item.packaging || "Packaging not documented"}{item.collectionId ? ` · ${item.collectionId}` : ""}</small></span><b>{item.currentQty ?? "—"} · {item.packaging?"View":"Add packaging"} →</b></Link>)}</article>
      <article className="section card"><div className="eyebrow">Collection relationships</div><h2>{story.collections.length || "No"} named collection{story.collections.length === 1 ? "" : "s"}</h2>{story.collections.map(item => <Link className="storyRow" href={`/collections/${encodeURIComponent(item.collectionId)}`} key={item.collectionId}><span><strong>{item.name}</strong><small>{item.releaseYear || "Release year pending"} · {item.status || "Review"}</small></span><b>→</b></Link>)}{!story.collections.length && <p className="small">This cigar is not currently attached to a named collection.</p>}</article>
    </section>
    <SmokingExperienceScorecardView lot={smokingScorecards.lot} identity={smokingScorecards.identity}/>

    <section className="storyColumns">
      <article className="section card"><div className="eyebrow">Personal journal</div><h2>{story.smokes.length} experience{story.smokes.length === 1 ? "" : "s"}</h2>{story.smokes.slice(0, 5).map(item => <div className="storyRow" key={item.smokeId}><span><strong>{item.dateSmoked}</strong><small>{item.flavor || item.tastingNotes || "No tasting note"}</small>{(item.construction||item.burn)&&<small>{item.construction?`Construction: ${item.construction}`:""}{item.construction&&item.burn?" · ":""}{item.burn?`Burn: ${item.burn}`:""}</small>}</span><b>{item.overall ?? "—"}</b></div>)}{!story.smokes.length && <p className="small">No smoke recorded yet. Your first note can be simple and entirely your own.</p>}</article>
      <article className="section card"><div className="eyebrow">Evidence ledger</div><h2>{story.valuations.length + story.ratings.length} connected records</h2>{story.valuations.slice(0, 3).map(item => <a className="storyRow" href={item.sourceUrl || "#"} key={item.valuationId}><span><strong>{item.source || "Collector valuation"}</strong><small>{item.valuationDate} · {item.confidence || "Unrated"} confidence</small></span><b>{money(item.marketValue ?? item.replacementValue)}</b></a>)}{story.ratings.slice(0, 3).map(item => <a className="storyRow" href={item.sourceUrl} key={item.ratingId}><span><strong>{item.publication}</strong><small>{item.matchConfidence} identity match</small></span><b>{item.score} ↗</b></a>)}</article>
    </section>

    <p className="storyDisclosure">The platform keeps retail replacement, market estimates, completed-sale evidence, professional reviews, and your personal experience visibly separate. Uncertainty is preserved rather than presented as fact.</p>
  </main>;
}
