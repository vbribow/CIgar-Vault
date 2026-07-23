import { summarizeCollection } from "@/lib/collection-dashboard";
import type { CigarCollection, InventoryItem, Valuation } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CollectionDashboard({ collections, inventory, valuations }: { collections: CigarCollection[]; inventory: InventoryItem[]; valuations: Valuation[] }) {
  const dashboard = collections.map((collection) => ({ collection, summary: summarizeCollection(collection, inventory, valuations) })).sort((a, b) => b.summary.wholeValue - a.summary.wholeValue);
  return <section className="collectionDashboard"><div className="collectionDashboardHead"><div><div className="eyebrow">Portfolio dashboard</div><h2>Collection value and completeness</h2></div><p>Whole-set values take priority when entered. Component totals use the latest per-cigar valuation multiplied by current quantity.</p></div><div className="collectionDashboardGrid">
    {dashboard.map(({ collection, summary }) => { const peak = Math.max(...summary.valueHistory.map((point) => point.value), 1); return <article className="collectionDashboardCard" key={collection.collectionId}>
      <header><div><div className="eyebrow">{collection.maker || "Collector set"}{collection.releaseYear ? ` · ${collection.releaseYear}` : " · Year needed"}</div><h3>{collection.name}</h3></div><a href={`/collections/${encodeURIComponent(collection.collectionId)}`}>Open collection →</a></header>
      <div className="collectionDashboardFacts"><div><span>Retail / whole value</span><strong>{summary.valueEvidence === "Pending" ? "Research pending" : money.format(summary.wholeValue)}</strong><small>{summary.valueEvidence}{summary.valueAsOf ? ` · ${summary.valueAsOf}` : ""}</small></div><div><span>Components</span><strong>{summary.componentValue > 0 ? money.format(summary.componentValue) : "Valuation pending"}</strong></div><div><span>Set premium</span><strong>{summary.valueEvidence !== "Pending" && summary.componentValue > 0 ? money.format(summary.premium) : "Pending"}</strong></div></div>
      <div className="collectionCompletion"><i style={{ width: `${summary.completionPercent}%` }} /></div><div className="collectionDashboardMeta"><span>{summary.completionPercent}% complete</span><span>{summary.ownedComponents}{summary.expectedComponents ? ` of ${summary.expectedComponents}` : ""} components · {summary.expectedCigars??"Unknown"} expected cigars</span></div>
      {summary.missingComponents.length > 0 && <div className="missingPieces"><strong>{summary.missingComponents.length} missing piece{summary.missingComponents.length === 1 ? "" : "s"}</strong><ul>{summary.missingComponents.slice(0, 4).map((piece) => <li key={piece}>{piece}</li>)}</ul>{summary.missingComponents.length > 4 && <small>+ {summary.missingComponents.length - 4} more</small>}</div>}
      {summary.valueHistory.length > 0 && <><div className="valueHistory" aria-label="Valuation history">{summary.valueHistory.map((point) => <i key={point.date} title={`${point.date}: ${money.format(point.value)}`} style={{ height: `${Math.max(8, point.value / peak * 100)}%` }} />)}</div><div className="valueHistoryLabel"><span>{summary.valueHistory[0].date}</span><span>{summary.valueHistory.length} valuation date{summary.valueHistory.length === 1 ? "" : "s"}</span><span>{summary.valueHistory.at(-1)?.date}</span></div></>}
    </article>; })}
    {!dashboard.length && <div className="emptyState">Create a collection to begin tracking whole-set value and completeness.</div>}
  </div></section>;
}
