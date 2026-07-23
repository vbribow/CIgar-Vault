import { notFound } from "next/navigation";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadActivities, loadRatings, loadSmokingLogs, loadValuations } from "@/lib/data";
import { ratingSummary, ratingsForInventory } from "@/lib/cigar-ratings";
import { InventoryRecordTools } from "@/components/inventory-record-tools";
import { buildCigarTimeline,estimateAging } from "@/lib/collection-intelligence";
import { EvidenceLabel } from "@/components/evidence-label";
export const dynamic = "force-dynamic";
export default async function CigarPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>;
}) {
  const { inventoryId } = await params;
  const items = await loadInventory();
  const item = items.find((i) => i.inventoryId === inventoryId);
  if (!item) notFound();
  const mode = await accountDataMode();
  const [smokes, valuations, activities, ratings] =
    mode === "mock"
      ? [[], [], [], []]
      : await Promise.all([loadSmokingLogs(), loadValuations(), loadActivities(), loadRatings()]);
  const history = smokes.filter((s) => s.inventoryId === inventoryId);
  const values = valuations.filter((v) => v.inventoryId === inventoryId);
  const latestSale = values
    .filter((value) => value.lastSaleValue !== undefined)
    .sort((a, b) => (b.lastSaleDate || b.valuationDate).localeCompare(a.lastSaleDate || a.valuationDate))[0];
  const events = activities.filter((a) => a.inventoryId === inventoryId);
  const publishedRatings = ratingsForInventory(ratings, inventoryId);
  const published = ratingSummary(ratings, inventoryId);
  const aging=estimateAging(item);
  const timeline=buildCigarTimeline(item,events,history,values,publishedRatings);
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          Cedriva
        </a>
        <a className="backLink" href="/inventory">
          ← Collection
        </a>
      </nav>
      <section className="detailHero">
        <div>
          <div className="eyebrow">
            {item.inventoryId} · {item.status || "Review"}
          </div>
          <h1>{item.brand}</h1>
          <p>{item.line}</p>
          <span>
            {item.vitola}
            {item.vintage ? ` · ${item.vintage}` : ""}
          </span>
        </div>
        <div className="scoreCard">
          <small>Personal collection score</small>
          <strong>{item.score ?? "—"}</strong>
          <span>{item.priority || "Unrated priority"}</span>
        </div>
      </section>
      <section className="cigarStory">
        <div><div className="eyebrow">The story in your collection</div><h2>{item.line || item.brand}</h2><p>{item.provenanceNotes || item.notes || `This ${item.vitola} is documented as part of your collection${item.vintage?` from ${item.vintage}`:""}. Add the acquisition, people, place, or occasion behind it to preserve why it matters—not only what it is.`}</p><a className="textLink" href="#record-tools">Continue documenting its story →</a></div>
        <div className="cigarStoryFacts"><article><span>Identity</span><strong>{item.brand} · {item.line}</strong><small>{item.vitola}{item.vintage?` · ${item.vintage}`:""}</small></article><article><span>Your chapter</span><strong>{history.length} smoking experience{history.length===1?"":"s"}</strong><small>{events.length} documented collection event{events.length===1?"":"s"}</small></article><article><span>Provenance</span><strong>{item.boxCode||item.provenanceDocumentLink?"Evidence started":"Story waiting"}</strong><small>{item.storageLocationId?`Cared for in ${item.storageLocationId}`:"Storage not yet documented"}</small></article></div>
      </section>
      <EvidenceLabel evidence={{kind:"Community",sourceName:"Your private collector record",confidence:item.provenanceNotes||item.boxCode?"Medium":"Unrated",supports:"Identity, ownership context, and personal provenance",commercialInfluence:"None disclosed"}}/>
      <section className="section card professionalRatings"><div className="sectionHead"><div><div className="eyebrow">Published reviews</div><h2>{published.highest ? `${published.highest} highest professional score` : "No professional rating saved"}</h2><p className="small">{published.count ? `${published.average} average across ${published.count} source${published.count===1?"":"s"}` : "Research exact brand, line, vitola, and vintage matches."}</p></div><a className="button secondary" href="/ratings">Research ratings</a></div>{publishedRatings.map(rating=><a className="historyRow" href={rating.sourceUrl} target="_blank" rel="noreferrer" key={rating.ratingId}><span>{rating.publication} · {rating.reviewDate||"date not stated"} · {rating.matchConfidence} match</span><strong>{rating.score} ↗</strong></a>)}</section>
      <section className="detailStats">
        <div>
          <span>Remaining</span>
          <strong>{item.currentQty ?? "—"}</strong>
        </div>
        <div>
          <span>Original</span>
          <strong>{item.originalQty ?? "—"}</strong>
        </div>
        <div>
          <span>Retail replacement / cigar</span>
          <strong>
            {item.retailValue ? `$${item.retailValue.toLocaleString()}` : "—"}
          </strong>
        </div>
        <div>
          <span>Storage</span>
          <strong>{item.storageLocationId || "Not set"}</strong>
        </div>
      </section>
      <section className="section card"><div className="sectionHead"><div><div className="eyebrow">Market transaction evidence</div><h2>{latestSale ? `$${latestSale.lastSaleValue!.toLocaleString()} per cigar` : "No verified completed sale recorded"}</h2><p className="small">{latestSale ? `Last known completed sale · ${latestSale.lastSaleDate || latestSale.valuationDate}${latestSale.lastSaleVenue ? ` · ${latestSale.lastSaleVenue}` : ""}` : "Auction estimates, open lots, and asking prices are not labeled as sales."}</p></div>{latestSale?.lastSaleSourceUrl ? <a className="button secondary" href={latestSale.lastSaleSourceUrl} target="_blank" rel="noreferrer">View sale evidence ↗</a> : <a className="button secondary" href="/valuations">Research sale history</a>}</div><div className="detailStats"><div><span>Retail replacement</span><strong>{item.retailValue === undefined ? "Not researched" : `$${item.retailValue.toLocaleString()} / cigar`}</strong></div><div><span>Retail lot subtotal</span><strong>{item.retailValue === undefined || item.currentQty === undefined ? "Not available" : `$${(item.retailValue * item.currentQty).toLocaleString()}`}</strong></div><div><span>Latest completed sale</span><strong>{latestSale?.lastSaleValue === undefined ? "Not found" : `$${latestSale.lastSaleValue.toLocaleString()} / cigar`}</strong></div><div><span>Sale venue</span><strong>{latestSale?.lastSaleVenue || "Not documented"}</strong></div></div></section>
      <section className="section card agingIntelligence"><div><div className="eyebrow">Predictive aging · AI-assisted</div><h2>{aging.phase}</h2><p>{aging.age===undefined?aging.basis:`${aging.age} years estimated age · ${aging.maturityPercent}% general maturity estimate`}</p></div><div><span>Expected general peak</span><strong>{aging.peakWindow||"Year required"}</strong><small>{aging.basis}</small></div><a className="button secondary" href={`/cigar-somm?inventoryId=${encodeURIComponent(item.inventoryId)}`}>Consult Cedriva AI</a></section>
      <section className="detailGrid">
        <article className="card">
          <div className="eyebrow">Collector direction</div>
          <h2>{item.action || "Review this cigar"}</h2>
          <p className="small">
            {item.provenanceNotes ||
              item.notes ||
              "Add provenance and tasting context to make this recommendation more useful."}
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Smoking history</div>
          <h2>{history.length} recorded</h2>
          {history.slice(0, 3).map((s) => (
            <p key={s.smokeId} className="historyRow">
              <span>{s.dateSmoked}</span>
              <strong>{s.overall ?? "—"}</strong>
            </p>
          ))}
          {!history.length && <p className="small">No smokes logged yet.</p>}
          <a className="textLink" href="/records">
            Add tasting note →
          </a>
        </article>
        <article className="card">
          <div className="eyebrow">Valuation history</div>
          <h2>{values.length} recorded</h2>
          {values.slice(0, 3).map((v) => (
            <p key={v.valuationId} className="historyRow">
              <span>{v.valuationDate}</span>
              <strong>${v.marketValue ?? v.replacementValue ?? 0}</strong>
            </p>
          ))}
          {!values.length && <p className="small">No dated valuations yet.</p>}
          <a className="textLink" href="/records">
            Add valuation →
          </a>
        </article>
      </section>
      <section className="section card cigarTimeline">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Ownership intelligence</div>
            <h2>{timeline.length} timeline events</h2>
            <p className="small">Purchases, moves, smokes, scores, professional reviews, and valuation changes in one history.</p>
          </div>
          <a
            className="button secondary"
            href={`/activity?inventoryId=${item.inventoryId}`}
          >
            Record activity
          </a>
        </div>
        {timeline.slice(0, 20).map((event,index) => (
          <article className="timelineEvent" key={`${event.date}-${event.type}-${index}`}><i/><span>{event.date}</span><div><small>{event.type}</small><strong>{event.title}</strong><p>{event.detail}</p></div></article>
        ))}
        {!timeline.length && (
          <p className="small">
            No timeline evidence yet. Start with a purchase, valuation, tasting,
            or storage move.
          </p>
        )}
      </section>
      <div id="record-tools"><InventoryRecordTools initialItem={item} inventory={items} mode={mode} /></div>
    </main>
  );
}
