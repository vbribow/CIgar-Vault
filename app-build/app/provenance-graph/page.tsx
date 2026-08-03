import type { Metadata } from "next";
import { loadInventory } from "@/lib/inventory";
import { loadCatalog } from "@/lib/catalog";
import { loadPublicIndustry } from "@/lib/industry-public";
import { buildProvenanceGraph, provenanceModel } from "@/lib/provenance-graph";
import { brand } from "@/lib/brand";
import type { CatalogCigar, InventoryItem } from "@/lib/types";
import "./provenance.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Canonical Provenance Graph",description:`How ${brand.name} connects cigar identity, manufacturing, release history, artifacts, evidence, and private collector lots.`};

export default async function ProvenanceGraphPage(){
  const [inventoryResult, industryResult] = await Promise.allSettled([loadInventory(), loadPublicIndustry()]);
  const inventory: InventoryItem[] = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
  const industry = industryResult.status === "fulfilled" ? industryResult.value : { profiles: [], publications: [], revisions: [], registryRecords: [] };
  let catalog: CatalogCigar[] = [];
  try { catalog = await loadCatalog(inventory); } catch { /* The graph remains explorable while the optional catalog provider is unavailable. */ }
  const graphs=catalog.slice(0,12).map(item=>({item,graph:buildProvenanceGraph(item,inventory,industry.registryRecords)}));
  const model=provenanceModel();
  return <main className="shell wideShell provenancePage"><section className="provenanceHero"><div><div className="eyebrow">Canonical provenance graph</div><h1>Every cigar connects to people, place, time, and evidence.</h1><p className="lede">The platform does not flatten a cigar into one inventory row. The graph preserves the product, the work behind it, the artifacts that identify it, and the private story of each collector lot.</p></div><aside><strong>9</strong><span>connected record types</span><p>Shared knowledge stays separate from private ownership, while evidence travels with every claim.</p></aside></section>
    <section className="provenanceModel">{model.map((item,index)=><article key={item.type}><span>{String(index+1).padStart(2,"0")}</span><h2>{item.type}</h2><p>{item.promise}</p>{index<model.length-1&&<i>→</i>}</article>)}</section>
    <section className="provenanceRules"><article><strong>Shared knowledge</strong><p>Brands, products, vitolas, blends, factories, releases, packaging, and attributable evidence can serve the whole community.</p></article><article><strong>Private stewardship</strong><p>Acquisition, quantity, location, value, notes, condition, custody, and legacy instructions remain collector-controlled.</p></article><article><strong>No silent inheritance</strong><p>A brand-level factory relationship never becomes product-level proof without evidence for the exact cigar and period.</p></article></section>
    <section className="provenanceExamples"><div className="sectionHead"><div><div className="eyebrow">Live graph health</div><h2>Where the current records connect—and where history is still missing.</h2></div><a className="button secondary" href="/industry/registry">Open registry</a></div><div>{graphs.map(({item,graph})=><a href={`/catalog/${encodeURIComponent(item.catalogId)}`} key={item.catalogId}><header><span>{graph.completion}% connected</span><strong>{graph.nodes.length} nodes · {graph.edges.length} relationships</strong></header><h3>{item.brand} {item.line}</h3><p>{item.vitola}</p><div>{graph.nodes.map(node=><span data-trust={node.trust} key={node.id}>{node.type}</span>)}</div><small>{graph.missing.length?`Still needed: ${graph.missing.join(" · ")}`:"All nine record types represented."}</small></a>)}</div>{!graphs.length&&<div className="emptyState">Document the first cigar to begin its provenance graph.</div>}</section>
    <section className="provenancePromise"><div className="eyebrow">Permanent design rule</div><h2>The graph may grow. Its history must never collapse.</h2><p>Releases, packaging, manufacturing relationships, evidence, and custody can change over time. {brand.name} preserves each dated state so a later correction adds truth without erasing the past.</p></section>
  </main>;
}
