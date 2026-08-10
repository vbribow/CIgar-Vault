import { notFound } from "next/navigation";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadActivities, loadCollections, loadHumidorReadings, loadHumidors, loadRatings, loadSmokingLogs, loadValuations } from "@/lib/data";
import { ValuationInvalidationControl } from "@/components/valuation-invalidation-control";
import { ratingResearchHref, ratingSummary, ratingsForInventory } from "@/lib/cigar-ratings";
import { InventoryRecordTools } from "@/components/inventory-record-tools";
import { buildCigarTimeline,estimateAging } from "@/lib/collection-intelligence";
import { EvidenceLabel } from "@/components/evidence-label";
import { canonicalCigarIdentity } from "@/lib/cigar-identity";
import { cigarAdvisorActions, cigarAdvisorHref } from "@/lib/cigar-advisor-links";
import { cigarStoryHref } from "@/lib/cigar-story";
import { claimsUnverifiedCompletedSale, completedSaleLabel, isVerifiedCompletedSale, marketAskingPriceLabel, marketEvidenceType, marketRangeText, strongestEvidenceUrl } from "@/lib/valuation-evidence";
import { climateIntelligence } from "@/lib/climate-intelligence";
import { collectionContentsSummary, inventoryCollectionRelationships, isPresentationInventoryRecord } from "@/lib/collection-presentation";
import { CollectionRelationshipTag } from "@/components/collection-relationship-tag";
import { RecommendationFactEditor } from "@/components/recommendation-fact-editor";
import { SmokingExperienceScorecardView } from "@/components/smoking-experience-scorecard";
import { buildSmokingExperienceScorecards } from "@/lib/smoking-scorecard";
import { brand } from "@/lib/brand";
import { cubanVerificationStatus, isCubanInventory } from "@/lib/cuban-verification";
import { HABANOS_AUTHENTICITY_URL, HABANOS_EVIDENCE_CAUTION, OFAC_CUBAN_GOODS_URL } from "@/lib/habanos-protection";
import { safeInternalHref } from "@/lib/search-navigation";
import Link from "next/link";
import { BuyAgainPanel } from "@/components/buy-again-panel";
import { RatingLeafMark } from "@/components/rating-leaf-mark";
import { InventoryRecordActions } from "@/components/inventory-record-actions";
import { InventoryManager } from "@/components/inventory-manager";
import { safeRecordedPurchaseUrl } from "@/lib/buy-again";
import { loadCatalog } from "@/lib/catalog";
import { cigarReferencePhoto } from "@/lib/cigar-reference-photo";
import { CigarReferencePhoto } from "@/components/cigar-reference-photo";
import "./climate.css";
export const dynamic = "force-dynamic";
export default async function CigarPage({
  params,
  searchParams,
}: {
  params: Promise<{ inventoryId: string }>;
  searchParams: Promise<{ searchReturn?: string; saved?: string }>;
}) {
  const [{ inventoryId }, query] = await Promise.all([params, searchParams]);
  const searchReturn = safeInternalHref(query.searchReturn);
  const focusedVaultHref=`/inventory?vaultSearch=${encodeURIComponent(inventoryId)}#inventory-records`;
  const backHref = searchReturn || focusedVaultHref;
  const backLabel = searchReturn ? "← Back to search results" : "← Back to Vault";
  const inlineEditHref="#inventory-editor";
  const [inventoryResult, modeResult] = await Promise.allSettled([loadInventory(), accountDataMode()]);
  if (inventoryResult.status === "rejected" || modeResult.status === "rejected") {
    return <main className="shell"><nav className="nav"><Link className="brand" href="/">{brand.name}</Link><Link className="backLink" href={backHref}>{backLabel}</Link></nav><Link className="button secondary detailReturnLink" href={backHref}>{backLabel}</Link><section className="section card cigarRecordUnavailable"><div className="eyebrow">Inventory record protected</div><h1>This cigar is temporarily unavailable.</h1><p>The platform could not safely verify the account and inventory record together. It has not been classified as missing or deleted.</p><Link className="button secondary" href={`/inventory/${encodeURIComponent(inventoryId)}`}>Try again</Link></section></main>;
  }
  const items = inventoryResult.value;
  const item = items.find((i) => i.inventoryId === inventoryId);
  if (!item) notFound();
  const mode = modeResult.value;
  const [smokesResult, valuationsResult, activitiesResult, ratingsResult, collectionsResult, humidorsResult, climateReadingsResult, catalogResult] =
    await Promise.allSettled([
      mode === "mock" ? Promise.resolve([]) : loadSmokingLogs(),
      loadValuations(),
      mode === "mock" ? Promise.resolve([]) : loadActivities(),
      mode === "mock" ? Promise.resolve([]) : loadRatings(),
      mode === "mock" ? Promise.resolve([]) : loadCollections(),
      mode === "mock" ? Promise.resolve([]) : loadHumidors(),
      mode === "mock" ? Promise.resolve([]) : loadHumidorReadings(),
      loadCatalog(items),
    ] as const);
  const smokes = smokesResult.status === "fulfilled" ? smokesResult.value : [];
  const valuations = valuationsResult.status === "fulfilled" ? valuationsResult.value : [];
  const activities = activitiesResult.status === "fulfilled" ? activitiesResult.value : [];
  const ratings = ratingsResult.status === "fulfilled" ? ratingsResult.value : [];
  const collections = collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
  const humidors = humidorsResult.status === "fulfilled" ? humidorsResult.value : [];
  const climateReadings = climateReadingsResult.status === "fulfilled" ? climateReadingsResult.value : [];
  const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : [];
  const smokesReady = smokesResult.status === "fulfilled";
  const valuationsReady = valuationsResult.status === "fulfilled";
  const activitiesReady = activitiesResult.status === "fulfilled";
  const ratingsReady = ratingsResult.status === "fulfilled";
  const climateReady = humidorsResult.status === "fulfilled" && climateReadingsResult.status === "fulfilled";
  const catalogReady = catalogResult.status === "fulfilled";
  const timelineReady = smokesReady && valuationsReady && activitiesReady && ratingsReady;
  const collectionRelationship=inventoryCollectionRelationships(items,collections).get(item.inventoryId)
    ??(isPresentationInventoryRecord(item,collections)?{kind:"presentation" as const}:undefined);
  const isPresentationAsset=collectionRelationship?.kind==="presentation";
  const presentationContents=isPresentationAsset&&collectionRelationship.collection
    ?collectionContentsSummary(collectionRelationship.collection,items)
    :undefined;
  const documentedPresentationCigars=presentationContents?.documentedCigars
    ??(Number(`${item.provenanceNotes||""} ${item.notes||""}`.match(/\b(\d{2,4}) included cigars\b/i)?.[1]||0)||undefined);
  const history = smokes.filter((s) => s.inventoryId === inventoryId);
  const smokingScorecards = buildSmokingExperienceScorecards(item, items, smokes);
  const values = valuations.filter((v) => v.inventoryId === inventoryId);
  const rawLatestValue = [...values].sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate))[0];
  const latestValue = rawLatestValue ? { ...rawLatestValue, sourceUrl: strongestEvidenceUrl(rawLatestValue.sourceUrl) } : undefined;
  const latestSale = values
    .filter(isVerifiedCompletedSale)
    .sort((a, b) => (b.lastSaleDate || b.valuationDate).localeCompare(a.lastSaleDate || a.valuationDate))[0];
  const legacySaleClaim = [...values].sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate)).find(claimsUnverifiedCompletedSale);
  const events = activities.filter((a) => a.inventoryId === inventoryId);
  const publishedRatings = ratingsForInventory(ratings, inventoryId);
  const published = ratingSummary(ratings, inventoryId);
  const identity=canonicalCigarIdentity(item);
  const aging=estimateAging(item);
  const advisorActions=cigarAdvisorActions(item);
  const timeline=buildCigarTimeline(item,events,history,values,publishedRatings);
  const storageHumidor=humidors.find(humidor=>humidor.humidorId===item.storageLocationId);
  const storageClimate=storageHumidor?climateIntelligence(storageHumidor,climateReadings):undefined;
  const referencePhoto=catalogReady?cigarReferencePhoto(item,catalog):undefined;
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          {brand.name}
        </a>
        <Link className="backLink" href={backHref}>
          {backLabel}
        </Link>
      </nav>
      <Link className="button secondary detailReturnLink" href={backHref}>
        {backLabel}
      </Link>
      {query.saved==="inventory"&&<section className="inventorySavedConfirmation" role="status" aria-live="polite" aria-atomic="true"><div><div className="eyebrow">Save complete</div><strong>Saved to your private Vault</strong><p>{item.brand} {item.line} is ready below. This is the exact record that was saved.</p></div><div className="inventorySavedActions"><Link href="/inventory#mobile-intake">Add another cigar</Link><Link href={backHref}>Return to Vault</Link></div></section>}
      <section className="detailHero" id="record-top">
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
          <CollectionRelationshipTag relationship={collectionRelationship}/>
          <div className="ctaRow detailHeroActions"><Link className="button secondary" href={inlineEditHref}>Edit box or cigar quantity</Link><Link className="button secondary" href="#record-photos">Add photos</Link><InventoryRecordActions item={item} editHref={inlineEditHref}/></div>
        </div>
        <div className="scoreCard">
          <RatingLeafMark value={item.score ?? "—"} label="Personal collection score" detail={item.priority || "Unrated priority"}/>
          {!isPresentationAsset&&<Link className="button secondary" href={inlineEditHref}>{item.score===undefined?"Rate this cigar":"Update rating"}</Link>}
        </div>
      </section>
      <InventoryManager initialItems={items} catalog={catalog} ratings={ratings} collections={collections} humidors={humidors} mode={mode} initialEditId={item.inventoryId} initialEditMode="all" editorOnly saveReturnHref={`/inventory/${encodeURIComponent(item.inventoryId)}?saved=inventory#inventory-editor`}/>
      {!isPresentationAsset&&<CigarReferencePhoto item={item} photo={referencePhoto} catalogReady={catalogReady}/>}
      {!isPresentationAsset && <BuyAgainPanel inventoryId={item.inventoryId} identity={`${item.brand} · ${item.line} · ${item.vitola}${item.vintage ? ` · ${item.vintage}` : ""}`} seller={item.acquisitionSeller} purchaseDate={item.acquisitionDate} jurisdiction={item.purchaseJurisdiction} sourceUrl={safeRecordedPurchaseUrl(item.acquisitionSourceUrl)} positiveJournalCount={history.filter((entry) => entry.buyAgain).length} />}
      <section className="cigarStory">
        <div><div className="eyebrow">The story in your collection</div><h2>{item.line || item.brand}</h2><p>{item.provenanceNotes || item.notes || `This ${item.vitola} is documented as part of your collection${item.vintage?` from ${item.vintage}`:""}. Add the acquisition, people, place, or occasion behind it to preserve why it matters—not only what it is.`}</p>{!item.provenanceNotes&&<RecommendationFactEditor item={item} fact="provenanceNotes"/>}<a className="textLink" href="#record-tools">Continue documenting its story →</a></div>
        <div className="cigarStoryFacts"><article><span>{isPresentationAsset?"Presentation asset":"Canonical identity"}</span><strong>{item.brand} · {item.line}</strong><small>{isPresentationAsset?"Tracked separately from the collection’s cigar components":<>{item.vitola}{item.vintage?` · ${item.vintage}`:""} · {identity.identityId}</>}</small>{isPresentationAsset&&collectionRelationship.collection?<a className="textLink" href={`/collections/${encodeURIComponent(collectionRelationship.collection.collectionId)}`}>Open collection record →</a>:<a className="textLink" href={cigarStoryHref(item)}>Open unified Cigar Story →</a>}</article><article><span>Connected knowledge</span><strong>{isPresentationAsset?(valuationsReady?`${values.length} presentation value record${values.length===1?"":"s"}`:"Values unavailable"):<>{ratingsReady?`${publishedRatings.length} review${publishedRatings.length===1?"":"s"}`:"Reviews unavailable"} · {valuationsReady?`${values.length} value record${values.length===1?"":"s"}`:"values unavailable"}</>}</strong><small>{isPresentationAsset?"Presentation evidence does not create a cigar identity":identity.complete?"Exact identity ready":"Identity needs review before evidence can be reused"}</small></article><article><span>Your chapter</span><strong>{isPresentationAsset?(activitiesReady?`${events.length} documented collection event${events.length===1?"":"s"}`:"Collection events unavailable"):(smokesReady?`${history.length} smoking experience${history.length===1?"":"s"}`:"Smoking history unavailable")}</strong><small>{isPresentationAsset?"Record acquisition, serial number, certificate, and provenance":activitiesReady?`${events.length} documented collection event${events.length===1?"":"s"}`:"Collection events unavailable"}</small></article><article><span>Provenance</span><strong>{item.boxCode||item.provenanceDocumentLink?"Evidence started":item.provenanceNotes?"Story documented":"Story waiting"}</strong><small>{item.storageLocationId?`Cared for in ${item.storageLocationId}`:"Storage not yet documented"}</small></article></div>
      </section>
      <EvidenceLabel evidence={{kind:"Community",sourceName:"Your private collector record",confidence:item.provenanceNotes||item.boxCode?"Medium":"Unrated",supports:"Identity, ownership context, and personal provenance",commercialInfluence:"None disclosed"}}/>
      {isCubanInventory(item)&&<section className="section card"><div className="sectionHead"><div><div className="eyebrow">Habanos evidence record</div><h2>{cubanVerificationStatus(item)==="Verified"?"Official lookup result recorded":cubanVerificationStatus(item)}</h2><p>{HABANOS_EVIDENCE_CAUTION}</p></div><a className="button secondary" href="/verification">Open evidence ledger</a></div><div className="detailStats"><div><span>Seller</span><strong>{item.acquisitionSeller||"Not recorded"}</strong><small>{item.acquisitionDate||"Acquisition date not recorded"}</small></div><div><span>Jurisdiction</span><strong>{item.purchaseJurisdiction||"Not recorded"}</strong><small><a className="textLink" href={OFAC_CUBAN_GOODS_URL} target="_blank" rel="noreferrer">Open current U.S. guidance ↗</a></small></div><div><span>Package evidence</span><strong>{item.boxCode||"Box code not recorded"}</strong><small>{item.habanosSealPhotoLink?"Seal evidence linked":"Seal evidence not linked"}</small></div><div><span>Official lookup</span><strong>{item.habanosVerificationResult||"Result not recorded"}</strong><small>{item.habanosVerificationDate||"Lookup date not recorded"}</small></div></div><div className="ctaRow"><a className="button secondary" href={HABANOS_AUTHENTICITY_URL} target="_blank" rel="noreferrer">Open Habanos official lookup ↗</a><a className="button secondary" href="/learn/habanos-authenticity">Collector guide →</a></div><p className="sourceReturnNote">Official tools open in a new tab, so {brand.name} stays available when you return.</p></section>}
      {ratingsReady?<section className="section card professionalRatings"><div className="sectionHead"><div><div className="eyebrow">Published reviews</div><h2>{published.highest ? `${published.highest} highest professional score` : "No professional rating saved"}</h2><p className="small">{published.count ? `${published.average} average across ${published.count} source${published.count===1?"":"s"}` : "Research exact brand, line, vitola, and vintage matches."}</p></div><a className="button secondary" href={ratingResearchHref(item.inventoryId)}>Research ratings</a></div>{publishedRatings.map(rating=><a className="historyRow" href={rating.sourceUrl} target="_blank" rel="noreferrer" key={rating.ratingId}><span>{rating.publication} · {rating.reviewDate||"date not stated"} · {rating.matchConfidence} match</span><strong>{rating.score} ↗</strong></a>)}</section>:<UnavailableEvidence label="Published reviews"/>}
      <section className="detailStats">
        <div>
          <span>{isPresentationAsset?"Presentation units owned":"Remaining"}</span>
          <strong>{item.currentQty ?? "—"}</strong>
        </div>
        <div>
          <span>{isPresentationAsset?"Documented contents":"Original"}</span>
          <strong>{isPresentationAsset?(documentedPresentationCigars??presentationContents?.originalCigars??"—"):(item.originalQty ?? "—")}</strong>
          {isPresentationAsset&&presentationContents&&<small>{presentationContents.currentCigars} currently held across {presentationContents.componentLots} component lots</small>}
        </div>
        <div>
          <span>{isPresentationAsset?"Retail replacement / presentation":"Retail replacement / cigar"}</span>
          <strong>
            {item.retailValue ? `$${item.retailValue.toLocaleString()}` : "—"}
          </strong>
        </div>
        <div>
          <span>Storage</span>
          <strong>{item.storageLocationId || "Not set"}</strong>
        </div>
      </section>
      {valuationsReady?<section className="section card" id="value-evidence"><div className="sectionHead"><div><div className="eyebrow">Why this value? · {marketEvidenceType(latestValue)}</div><h2>{latestValue?.source || "Valuation evidence needed"}</h2><p className="small">{latestValue?`${latestValue.valuationDate} · ${latestValue.confidence || "Unrated"} confidence · ${latestValue.notes || "No evidence note supplied."}`:"No source-backed price evidence has been saved for this exact cigar identity."}</p></div><div className="ctaRow">{latestValue?.sourceUrl&&<a className="button secondary" href={latestValue.sourceUrl} target="_blank" rel="noreferrer">View strongest evidence ↗</a>}<a className="button secondary" href={`/valuations?inventoryId=${encodeURIComponent(item.inventoryId)}`}>{latestValue?"Research new evidence":"Research value"}</a><a className="button secondary" href={`/records?inventoryId=${encodeURIComponent(item.inventoryId)}`}>Enter manually</a>{latestValue&&<ValuationInvalidationControl valuationId={latestValue.valuationId}/>}</div></div><div className="detailStats"><div><span>Retail replacement</span><strong>{item.retailValue === undefined ? "Not researched" : `$${item.retailValue.toLocaleString()} / cigar`}</strong><small>Current replacement cost—not expected resale proceeds</small></div><div><span>{marketAskingPriceLabel}</span><strong>{latestValue?.askingPrice === undefined ? "Not found" : `$${latestValue.askingPrice.toLocaleString()} / cigar`}</strong><small>{latestValue?.askingPriceSource ? `${latestValue.askingPriceSource} · observed ${latestValue.valuationDate}` : "An active or archived listing is not proof of a sale"}</small>{latestValue?.askingPriceSourceUrl&&<a className="textLink" href={latestValue.askingPriceSourceUrl} target="_blank" rel="noreferrer">View listing ↗</a>}</div><div><span>Estimated market range</span><strong>{marketRangeText(latestValue) || "Insufficient evidence"}</strong><small>{latestValue?.marketValue === undefined ? "Precision is withheld until evidence supports it" : `Midpoint ${latestValue.marketValue.toLocaleString("en-US",{style:"currency",currency:"USD"})} / cigar`}</small></div><div><span>Latest completed sale</span><strong>{latestSale?.lastSaleValue === undefined ? "Not found" : `$${latestSale.lastSaleValue.toLocaleString()} / cigar`}</strong><small>{latestSale?.lastSaleDate || (legacySaleClaim?completedSaleLabel(legacySaleClaim):"Exact sold evidence required")}</small>{latestSale?.lastSaleSourceUrl&&<a className="textLink" href={latestSale.lastSaleSourceUrl} target="_blank" rel="noreferrer">View proof ↗</a>}</div></div>{legacySaleClaim&&!latestSale&&<p className="small">{completedSaleLabel(legacySaleClaim)}. The historical value is retained, but it is not counted as a verified sale.</p>}</section>:<UnavailableEvidence label="Valuation evidence"/>}
      <section className="section card agingIntelligence"><div><div className="eyebrow">Predictive aging · AI-assisted</div><h2>{aging.phase}</h2><p>{aging.age===undefined?aging.basis:`${aging.age} years estimated age · ${aging.maturityPercent}% general maturity estimate`}</p>{aging.age===undefined&&<RecommendationFactEditor item={item} fact="vintage"/>}<a className="textLink" href="/learn/resting-and-aging">Understand rest, true aging, and why no peak is guaranteed →</a></div><div><span>Expected general peak</span><strong>{aging.peakWindow||"Year required"}</strong><small>{aging.basis}</small></div></section>
      {climateReady?<section className={`section card cigarClimate ${storageClimate?.sustained?"sustained":""}`}><div><div className="eyebrow">Climate stewardship · {storageClimate?.profile.label||"Storage not connected"}</div><h2>{storageClimate?.state||"Assign this cigar to a humidor"}</h2><p>{storageClimate?.summary||"This cigar can be connected to its humidor profile, readings, sustained exposure, and recommended action once storage is documented."}</p>{!item.storageLocationId&&humidors.length>0&&<RecommendationFactEditor item={item} fact="storageLocationId" choices={humidors.map(humidor=>({value:humidor.humidorId,label:humidor.name||humidor.humidorId}))}/>} {!item.storageLocationId&&humidors.length===0&&<a className="button secondary" href="/humidors">Add a humidor first</a>}{storageClimate?.consequence&&<small>{storageClimate.consequence}</small>}</div><div className="cigarClimateFacts"><span><small>Latest environment</small><strong>{storageClimate?.latest?`${storageClimate.latest.temperatureF}°F · ${storageClimate.latest.humidity}% RH`:"No reading"}</strong></span><span><small>Observed exposure</small><strong>{storageClimate?`${storageClimate.exposureHours.tooWarm}h warm · ${storageClimate.exposureHours.tooDry}h dry · ${storageClimate.exposureHours.tooHumid}h humid`:"—"}</strong></span><span><small>Aging checkpoint</small><strong>{aging.phase} · {aging.peakWindow||"Add a vintage or production year"}<br/>Climate history qualifies the aging estimate; it does not guarantee a peak.</strong></span>{storageClimate?.action&&<span className="cigarClimateAction"><small>Recommended response</small><strong>{storageClimate.action}</strong></span>}<a className="textLink" href={storageHumidor?`/humidors/${encodeURIComponent(storageHumidor.humidorId)}`:"/humidors"}>{storageHumidor?"Open its climate history":"Review storage"} →</a></div></section>:<UnavailableEvidence label="Climate evidence"/>}
      <section className="section card cigarAdvisor"><div className="cigarAdvisorIntro"><div><div className="eyebrow">Cigar Somm · AI-assisted</div><h2>Build the experience around this exact cigar.</h2><p>Get its researched tasting profile, expected progression, smoking guidance, and coffee, spirit, cocktail, and nonalcoholic pairings.</p></div><a className="button" href={cigarAdvisorHref(item)}>Open in Cigar Somm</a></div><div className="cigarAdvisorActions">{advisorActions.map(action=><a href={action.href} key={action.intent}><span>{action.label}</span><small>{action.detail}</small><b>→</b></a>)}</div><small className="cigarAdvisorPrivacy">Your account context is summarized for the answer. It is not presented as a public source or shared with other collectors.</small></section>
      {!isPresentationAsset && smokesReady && <SmokingExperienceScorecardView lot={smokingScorecards.lot} identity={smokingScorecards.identity}/>}
      <section className="detailGrid">
        {valuationsReady&&legacySaleClaim&&!latestSale&&<article className="card"><div className="eyebrow">Valuation history</div><h2>{completedSaleLabel(legacySaleClaim)}</h2><p className="small">The historical market value is preserved, but it is not counted as a verified sale until value, sale date, and direct sold-lot proof are documented.</p></article>}
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
          <h2>{smokesReady?`${history.length} recorded`:"Temporarily unavailable"}</h2>
          {!smokesReady&&<p className="small">The platform is not treating an unavailable journal as an empty history.</p>}
          {smokesReady&&<>
          {history.slice(0, 3).map((s) => (
            <p key={s.smokeId} className="historyRow">
              <span>{s.dateSmoked}{(s.construction||s.burn)&&<small>{s.construction?`Construction: ${s.construction}`:""}{s.construction&&s.burn?" · ":""}{s.burn?`Burn: ${s.burn}`:""}</small>}</span>
              <strong>{s.overall ?? "—"}</strong>
            </p>
          ))}
          {!history.length && <p className="small">No smokes logged yet.</p>}
          <a className="textLink" href={`/records?inventoryId=${encodeURIComponent(item.inventoryId)}#log-smoke`}>
            Add tasting note →
          </a>
          </>}
        </article>
        <article className="card">
          <div className="eyebrow">Valuation history</div>
          <h2>{valuationsReady?`${values.length} recorded`:"Temporarily unavailable"}</h2>
          {!valuationsReady&&<p className="small">The platform is not treating unavailable market evidence as no valuation history.</p>}
          {valuationsReady&&<>
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
          </>}
        </article>
      </section>
      <section className="section card cigarTimeline">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Ownership intelligence</div>
            <h2>{timelineReady?`${timeline.length} timeline events`:"Timeline temporarily unavailable"}</h2>
            <p className="small">Purchases, moves, smokes, scores, professional reviews, and valuation changes in one history.</p>
          </div>
          <a
            className="button secondary"
            href={`/activity?inventoryId=${item.inventoryId}`}
          >
            Record activity
          </a>
        </div>
        {timelineReady&&timeline.slice(0, 20).map((event,index) => (
          <article className="timelineEvent" key={`${event.date}-${event.type}-${index}`}><i/><span>{event.date}</span><div><small>{event.type}</small><strong>{event.title}</strong><p>{event.detail}</p></div></article>
        ))}
        {timelineReady&&!timeline.length && (
          <p className="small">
            No timeline evidence yet. Start with a purchase, valuation, tasting,
            or storage move.
          </p>
        )}
        {!timelineReady&&<p className="small">One or more history sources could not be verified. The platform has paused the combined timeline rather than presenting a partial record as complete.</p>}
      </section>
      <div id="record-tools"><InventoryRecordTools initialItem={item} inventory={items} mode={mode} /></div>
    </main>
  );
}

function UnavailableEvidence({label}:{label:string}) {
  return <section className="section card cigarEvidenceUnavailable"><div className="eyebrow">{label} protected</div><h2>Temporarily unavailable</h2><p>The platform could not verify this evidence source. Nothing has been classified as absent, zero, or incomplete.</p></section>;
}
