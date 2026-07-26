import { notFound } from "next/navigation";
import { loadCollections, loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { collectionRequirementMatches, collectionTemplateFor, summarizeCollection } from "@/lib/collection-dashboard";
import "./detail.css";
import "./review.css";
import { accountDataMode } from "@/lib/user-data";
import { CollectionPopulateButton } from "@/components/collection-populate-button";
import { CollectionAssignmentReview } from "@/components/collection-assignment-review";
import { EvidenceLabel } from "@/components/evidence-label";
import { collectionEvidence } from "@/lib/trust-evidence";
import { collectionComponentMarketEvidence } from "@/lib/collection-market-evidence";
import { collectionTrustAudit } from "@/lib/collection-trust";
import { CollectionCompletionControl } from "@/components/collection-completion-control";
import { summarizeCollectionProvenance } from "@/lib/collection-provenance";
import { isPresentationInventoryMatch } from "@/lib/collection-presentation";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function CollectionDetailPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  const [collectionsResult, inventoryResult, valuationsResult, modeResult] =
    await Promise.allSettled([
      loadCollections(),
      loadInventory(),
      loadValuations(),
      accountDataMode(),
    ]);
  const coreReady =
    collectionsResult.status === "fulfilled" &&
    inventoryResult.status === "fulfilled" &&
    modeResult.status === "fulfilled";
  if (!coreReady) {
    return (
      <main className="shell collectionDetail">
        <div className="collectionBreadcrumbs"><a href="/inventory">← Back to Inventory</a><a href="/collections">All Collections</a></div>
        <nav className="nav">
          <a className="brand" href="/">Cedriva</a>
          <div className="navLinks">
            <a className="backLink" href="/collections">← Collections</a>
          </div>
        </nav>
        <section className="card collectionDetailUnavailable">
          <div className="eyebrow">Collection record protected</div>
          <h1>This collection is temporarily unavailable.</h1>
          <p>
            Cedriva could not safely load every core ownership source. The
            collection has not been classified as missing or deleted. Refresh
            after the account service recovers.
          </p>
        </section>
      </main>
    );
  }
  const collections = collectionsResult.value;
  const inventory = inventoryResult.value;
  const valuations =
    valuationsResult.status === "fulfilled" ? valuationsResult.value : [];
  const valuationReady = valuationsResult.status === "fulfilled";
  const mode = modeResult.value;
  const collection = collections.find((item) => item.collectionId === collectionId);
  if (!collection) notFound();
  const members = inventory.filter((item) => item.collectionId === collection.collectionId);
  const template = collectionTemplateFor(collection);
  const collectionPhoto=collection.photoLink||template?.imageUrl;
  const collectionPhotoSource=collection.photoLink?undefined:template?.imageSourceUrl;
  const evidence = collectionEvidence(collection,template?{name:template.sourceLabel,url:template.sourceUrl,date:template.valueAsOf}:undefined);
  const trust = collectionTrustAudit(collection,inventory,valuations);
  const matches = collectionRequirementMatches(collection, members);
  const verifiedIds=new Set(matches.flatMap(match=>match.inventoryId?[match.inventoryId]:[]));
  const verifiedMembers=template?members.filter(item=>verifiedIds.has(item.inventoryId)):members;
  const reviewMembers=template?members.filter(item=>!verifiedIds.has(item.inventoryId)):[];
  const repairableMembers=reviewMembers.filter(item=>item.notes?.includes("Expected component:"));
  const summary = summarizeCollection(collection, inventory, valuations);
  const identityReview=verifiedMembers.filter(item=>item.status==="Review"||/verify|unknown/i.test(item.vitola)).length;
  const provenance=summarizeCollectionProvenance(collection,template,verifiedMembers);
  const presentationAsset=inventory.find(item=>isPresentationInventoryMatch(item,collection));
  return <main className="shell collectionDetail">
    <div className="collectionBreadcrumbs"><a href="/inventory">← Back to Inventory</a><a href="/collections">All Collections</a></div>
    <nav className="nav"><a className="brand" href="/">Cedriva</a><div className="navLinks"><a href="/acquisitions">Acquisition planner</a><a className="backLink" href="/collections">← Collections</a></div></nav>
    <section className={`collectionDetailHero${collectionPhoto?" hasPhoto":""}`}><div><div className="eyebrow">{collection.maker || "Collector collection"}{collection.releaseYear ? ` · ${collection.releaseYear}` : ""}</div><h1>{collection.name}</h1><p>{collection.edition || collection.notes || "A unified view of this collectible set."}</p>{summary.editionIssue&&<div className="emptyState"><strong>Edition verification required.</strong> {summary.editionIssue} Correct the release year before populating or valuing this set as the researched edition.</div>}<div className="detailActions"><a className="button" href={`/cigar-somm?collectionId=${encodeURIComponent(collection.collectionId)}`}>Choose a cigar & pairing</a><a className="button secondary" href="/collections#collection-editor">Edit collection</a>{collection.valuationSourceUrl && <a className="button secondary" href={collection.valuationSourceUrl} target="_blank" rel="noreferrer">Valuation source ↗</a>}</div></div>{collectionPhoto?<figure className="collectionHeroPhoto"><img src={collectionPhoto} alt={`${collection.name} presentation`}/>{collectionPhotoSource&&<figcaption><a href={collectionPhotoSource} target="_blank" rel="noreferrer">{template?.imageSourceLabel||"Archival release photography"} ↗</a></figcaption>}</figure>:<div className="completionDial"><strong>{summary.completionPercent}%</strong><span>complete</span><small>{summary.ownedComponents}{summary.expectedComponents ? ` of ${summary.expectedComponents}` : ""} components</small></div>}</section>
    {!valuationReady&&<section className="card collectionDetailUnavailable"><div className="eyebrow">Values temporarily unavailable</div><p>Ownership, edition history, and component records remain available. Valuation evidence is hidden rather than presented as zero.</p></section>}
    {reviewMembers.length>0&&<CollectionAssignmentReview collectionId={collection.collectionId} items={reviewMembers} mode={mode}/>}
    {presentationAsset&&<section className="collectionChronology card"><div><div className="eyebrow">Presentation asset</div><h2>{presentationAsset.line}</h2><p>The humidor, serial number, certificate, and physical presentation are tracked separately from the cigar lots inside it.</p></div><div className="chronologyFacts"><article><strong>{presentationAsset.currentQty??"—"}</strong><span>presentation unit{presentationAsset.currentQty===1?"":"s"} owned</span></article><a className="button secondary" href={`/inventory/${encodeURIComponent(presentationAsset.inventoryId)}`}>View presentation record →</a></div></section>}
    {template&&<aside className="collectionStewardship"><span>Stewardship before speculation</span><strong>Preserve the edition, its makers, and its original presentation.</strong><p>Cedriva records this {template.releaseYear?`${template.releaseYear} `:""}work by {template.maker} from attributable sources. Market evidence is one chapter of the record—not the meaning of the collection.</p><a href={template.sourceUrl} target="_blank" rel="noreferrer">Read the documented source ↗</a></aside>}
    <section className="collectionChronology card"><div><div className="eyebrow">Edition chronology</div><h2>{provenance.collectionYear ? `${provenance.collectionYear} collection edition` : "Collection year needs documentation"}</h2><p>{provenance.yearPolicy}</p></div><div className="chronologyFacts"><article><strong>{provenance.recordedComponentYears}</strong><span>component years recorded</span></article><article><strong>{provenance.unknownComponentYears}</strong><span>component years still unknown</span></article><article><strong>{provenance.identityReview}</strong><span>identities needing review</span></article></div></section>
    <section className="collectionDetailStats"><article><span>Expected cigars</span><strong>{summary.expectedCigars??"Research needed"}</strong></article>{summary.expectedIdentities!==undefined&&<article><span>Distinct cigar identities</span><strong>{summary.expectedIdentities}</strong><small>{summary.expectedComponents} separately tracked physical lots</small></article>}<article><span>Complete-set retail</span><strong>{summary.valueEvidence === "Pending" ? "Research pending" : money.format(summary.wholeValue)}</strong><small>{summary.valueEvidence}{summary.valueAsOf ? ` · ${summary.valueAsOf}` : ""}</small></article><article><span>Included cigar retail</span><strong>{summary.cigarRetailValue > 0 ? money.format(summary.cigarRetailValue) : "Valuation pending"}</strong><small>Original included quantities · {summary.retailCoverage}/{verifiedMembers.length} verified lots priced</small></article>{summary.isHumidorCollection&&<article><span>Residual humidor value</span><strong>{summary.humidorValue === undefined ? "Calculation pending" : money.format(summary.humidorValue)}</strong><small>{summary.humidorValueStatus}{summary.humidorValue !== undefined?" · set retail minus included cigar retail":""}</small></article>}<article><span>Current component value</span><strong>{summary.componentValue > 0 ? money.format(summary.componentValue) : "Valuation pending"}</strong><small>{summary.marketCoverage}/{verifiedMembers.length} verified lots market-priced</small></article><article><span>Verified completed sales</span><strong>{summary.completedSaleCoverage}/{verifiedMembers.length}</strong><small>Exact identity with dated proof</small></article><article><span>Collection premium</span><strong>{summary.valueEvidence !== "Pending" && summary.componentValue > 0 ? money.format(summary.premium) : "Pending"}</strong></article><article><span>Acquisition cost</span><strong>{collection.acquisitionCost === undefined ? "—" : money.format(collection.acquisitionCost)}</strong></article></section>
    <section className="section card collectionTrustAudit"><div className="sectionHead"><div><div className="eyebrow">Cedriva trust audit · {trust.score}%</div><h2>{trust.ready?"Collection record is fully documented":"What remains before this record is complete"}</h2><p>Retail, aftermarket evidence, and presentation value remain separate. A collection release year is never treated as an individual cigar production year.</p></div></div><div className="collectionChecklist">{trust.checks.map(check=><article className={check.status==="Verified"?"owned":"missing"} key={check.id}><i>{check.status==="Verified"?"✓":"!"}</i><div><strong>{check.label} · {check.status}</strong><small>{check.detail}</small></div>{check.href&&<a href={check.href} target={check.href.startsWith("http")?"_blank":undefined} rel={check.href.startsWith("http")?"noreferrer":undefined}>{check.href.startsWith("http")?"Review source ↗":"Resolve →"}</a>}</article>)}</div></section>
    <CollectionCompletionControl collectionId={collection.collectionId} mode={mode} missingComponents={summary.missingComponents.length} retailMissing={Math.max(0,verifiedMembers.length-summary.retailCoverage)} identityReview={identityReview}/>
    <EvidenceLabel evidence={evidence}/>
    {template && <section className="section card"><div className="sectionHead"><div><div className="eyebrow">Edition checklist · {summary.expectedCigars??"Unknown"} total cigars</div><h2>{summary.missingComponents.length ? `${summary.missingComponents.length} pieces still needed` : "Every required piece is represented"}</h2><p className="small">Published contents are preloaded from the researched edition. Confirming complete-set ownership creates linked inventory lots without duplicating existing component IDs.</p></div><a className="textLink" href={template.sourceUrl} target="_blank" rel="noreferrer">{template.sourceLabel} ↗</a></div>{(summary.missingComponents.length>0||repairableMembers.length>0)&&<CollectionPopulateButton collectionId={collection.collectionId} mode={mode} correctionCount={repairableMembers.length}/>}<div className="collectionChecklist">{matches.map((match) => <article className={match.inventoryId ? "owned" : "missing"} key={match.requirement}><i>{match.inventoryId ? "✓" : "+"}</i><div><strong>{match.requirement}</strong><small>{match.inventoryId ? match.label : "Not matched in current inventory"}</small></div>{match.inventoryId && <a href={`/inventory/${match.inventoryId}`}>View cigar →</a>}</article>)}</div></section>}
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Verified owned components</div><h2>{verifiedMembers.length} exact inventory lot{verifiedMembers.length === 1 ? "" : "s"}</h2></div><a className="button secondary" href="/collections#collection-editor">Manage components</a></div><div className="collectionMemberGrid">{verifiedMembers.map((item) => { const market = collectionComponentMarketEvidence(item,inventory,valuations); return <a href={`/inventory/${item.inventoryId}`} key={item.inventoryId}><div><span>{item.brand}</span><h3>{item.line}</h3><p>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</p>{market.reusedFromInventoryId&&<small>Connected exact-match evidence</small>}{market.completedSale&&<small>Last verified sale {money.format(market.completedSale.lastSaleValue!)} · {market.completedSale.lastSaleDate}</small>}</div><div className="memberNumbers"><strong>{item.currentQty ?? 0}</strong><small>sticks</small><b>{market.valueUnit === undefined ? "Value pending" : money.format(market.valueUnit * (item.currentQty ?? 0))}</b></div></a>; })}{!verifiedMembers.length && <div className="emptyState">No exact collection components are confirmed yet.</div>}</div></section>
    <section className="collectionHistory card"><div><div className="eyebrow">Value history</div><h2>{summary.valueHistory.length} dated snapshot{summary.valueHistory.length === 1 ? "" : "s"}</h2><p>Totals reflect the per-cigar evidence recorded for collection components on each date.</p></div><div className="historyRows">{summary.valueHistory.map((point) => <p key={point.date}><span>{point.date}</span><strong>{money.format(point.value)}</strong></p>)}{!summary.valueHistory.length && <p><span>No dated valuations yet</span><a href="/valuations">Research values →</a></p>}</div></section>
  </main>;
}
