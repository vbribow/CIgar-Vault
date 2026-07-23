import { loadCollections, loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { buildAcquisitionPlan } from "@/lib/acquisition-planner";
import "./acquisitions.css";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function AcquisitionsPage() {
  const [collections, inventory, valuations] = await Promise.all([loadCollections(), loadInventory(), loadValuations()]);
  const targets = buildAcquisitionPlan(collections, inventory, valuations);
  const high = targets.filter((target) => target.priority === "High").length;
  const collectionsAffected = new Set(targets.map((target) => target.collectionId)).size;
  return <main className="shell acquisitionsPage">
    <nav className="nav"><a className="brand" href="/">Cedriva</a><div className="navLinks"><a href="/collections">Collections</a><a href="/wishlist">Wishlist</a><span className="badge">Acquisition planner</span></div></nav>
    <section className="acquisitionHero"><div><div className="eyebrow">Collection completion</div><h1>Know exactly what to hunt next.</h1><p>Targets come from researched collection templates and your linked inventory. Estimated impact allocates the remaining whole-set premium across missing pieces; it is guidance, not a purchase-price estimate.</p></div><div className="acquisitionHeroCard"><strong>{targets.length}</strong><span>missing pieces</span><small>across {collectionsAffected} collections</small></div></section>
    <section className="collectionMetrics"><article><span>High priority</span><strong>{high}</strong><small>Near-complete or high-impact targets</small></article><article><span>Collections affected</span><strong>{collectionsAffected}</strong><small>Researched sets with missing pieces</small></article><article><span>Tracked targets</span><strong>{targets.length}</strong><small>No inventory changes are made here</small></article></section>
    <section className="acquisitionList"><div className="sectionHead"><div><div className="eyebrow">Ranked opportunity list</div><h2>Missing collection components</h2></div><a className="button secondary" href="/collections">Manage collections</a></div>{targets.map((target) => <article key={`${target.collectionId}-${target.requirement}`}><span className={`targetPriority ${target.priority.toLowerCase()}`}>{target.priority}</span><div className="targetMain"><small>{target.maker || "Collector set"}{target.releaseYear ? ` · ${target.releaseYear}` : ""}</small><h3>{target.requirement}</h3><p>{target.collectionName} · {target.completionPercent}% complete</p></div><div className="targetImpact"><span>Potential set impact</span><strong>{target.estimatedValueImpact ? money.format(target.estimatedValueImpact) : "Pending"}</strong><small>Not an asking price</small></div><div className="targetActions"><a href={`/collections/${encodeURIComponent(target.collectionId)}`}>Open collection</a>{target.sourceUrl && <a href={target.sourceUrl} target="_blank" rel="noreferrer">Verify edition ↗</a>}</div></article>)}{!targets.length && <div className="emptyState"><strong>No researched collection gaps found.</strong><p>Assign inventory to a researched collection or create a collection from the catalog to begin.</p></div>}</section>
  </main>;
}
