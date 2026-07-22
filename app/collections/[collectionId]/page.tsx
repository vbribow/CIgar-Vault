import { notFound } from "next/navigation";
import { loadCollections, loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { collectionRequirementMatches, collectionTemplateFor, summarizeCollection } from "@/lib/collection-dashboard";
import "./detail.css";
import { accountDataMode } from "@/lib/user-data";
import { CollectionPopulateButton } from "@/components/collection-populate-button";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function CollectionDetailPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  const [collections, inventory, valuations, mode] = await Promise.all([loadCollections(), loadInventory(), loadValuations(), accountDataMode()]);
  const collection = collections.find((item) => item.collectionId === collectionId);
  if (!collection) notFound();
  const members = inventory.filter((item) => item.collectionId === collection.collectionId);
  const summary = summarizeCollection(collection, inventory, valuations);
  const template = collectionTemplateFor(collection);
  const matches = collectionRequirementMatches(collection, members);
  const latest = new Map<string, typeof valuations[number]>();
  for (const valuation of [...valuations].sort((a, b) => a.valuationDate.localeCompare(b.valuationDate))) latest.set(valuation.inventoryId, valuation);
  return <main className="shell collectionDetail">
    <nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/acquisitions">Acquisition planner</a><a className="backLink" href="/collections">← Collections</a></div></nav>
    <section className="collectionDetailHero"><div><div className="eyebrow">{collection.maker || "Collector collection"}{collection.releaseYear ? ` · ${collection.releaseYear}` : ""}</div><h1>{collection.name}</h1><p>{collection.edition || collection.notes || "A unified view of this collectible set."}</p><div className="detailActions"><a className="button" href="/collections#collection-editor">Edit collection</a>{collection.valuationSourceUrl && <a className="button secondary" href={collection.valuationSourceUrl} target="_blank" rel="noreferrer">Valuation source ↗</a>}</div></div><div className="completionDial"><strong>{summary.completionPercent}%</strong><span>complete</span><small>{summary.ownedComponents}{summary.expectedComponents ? ` of ${summary.expectedComponents}` : ""} components</small></div></section>
    <section className="collectionDetailStats"><article><span>Expected cigars</span><strong>{summary.expectedCigars??"Research needed"}</strong></article><article><span>Whole-set value</span><strong>{money.format(summary.wholeValue)}</strong></article><article><span>Component value</span><strong>{money.format(summary.componentValue)}</strong></article><article><span>Collection premium</span><strong>{money.format(summary.premium)}</strong></article><article><span>Acquisition cost</span><strong>{collection.acquisitionCost === undefined ? "—" : money.format(collection.acquisitionCost)}</strong></article></section>
    {template && <section className="section card"><div className="sectionHead"><div><div className="eyebrow">Edition checklist · {summary.expectedCigars??"Unknown"} total cigars</div><h2>{summary.missingComponents.length ? `${summary.missingComponents.length} pieces still needed` : "Every required piece is represented"}</h2><p className="small">Published contents are preloaded from the researched edition. Confirming complete-set ownership creates linked inventory lots without duplicating existing component IDs.</p></div><a className="textLink" href={template.sourceUrl} target="_blank" rel="noreferrer">{template.sourceLabel} ↗</a></div>{summary.missingComponents.length>0&&<CollectionPopulateButton collectionId={collection.collectionId} mode={mode}/>}<div className="collectionChecklist">{matches.map((match) => <article className={match.inventoryId ? "owned" : "missing"} key={match.requirement}><i>{match.inventoryId ? "✓" : "+"}</i><div><strong>{match.requirement}</strong><small>{match.inventoryId ? match.label : "Not matched in current inventory"}</small></div>{match.inventoryId && <a href={`/inventory/${match.inventoryId}`}>View cigar →</a>}</article>)}</div></section>}
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Owned components</div><h2>{members.length} inventory lot{members.length === 1 ? "" : "s"}</h2></div><a className="button secondary" href="/collections#collection-editor">Manage components</a></div><div className="collectionMemberGrid">{members.map((item) => { const valuation = latest.get(item.inventoryId); const unit = valuation?.marketValue ?? item.retailValue; return <a href={`/inventory/${item.inventoryId}`} key={item.inventoryId}><div><span>{item.brand}</span><h3>{item.line}</h3><p>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</p></div><div className="memberNumbers"><strong>{item.currentQty ?? 0}</strong><small>sticks</small><b>{unit === undefined ? "Value pending" : money.format(unit * (item.currentQty ?? 0))}</b></div></a>; })}{!members.length && <div className="emptyState">No inventory has been assigned to this collection yet.</div>}</div></section>
    <section className="collectionHistory card"><div><div className="eyebrow">Value history</div><h2>{summary.valueHistory.length} dated snapshot{summary.valueHistory.length === 1 ? "" : "s"}</h2><p>Totals reflect the per-cigar evidence recorded for collection components on each date.</p></div><div className="historyRows">{summary.valueHistory.map((point) => <p key={point.date}><span>{point.date}</span><strong>{money.format(point.value)}</strong></p>)}{!summary.valueHistory.length && <p><span>No dated valuations yet</span><a href="/valuations">Research values →</a></p>}</div></section>
  </main>;
}
