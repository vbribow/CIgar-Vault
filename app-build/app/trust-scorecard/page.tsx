import type { Metadata } from "next";
import { loadInventory } from "@/lib/inventory";
import { loadCatalog } from "@/lib/catalog";
import { loadPublicIndustry } from "@/lib/industry-public";
import { buildTrustCoverage } from "@/lib/trust-coverage";
import "./scorecard.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Trust & Coverage Scorecard",description:"Transparent measurement of Cedriva’s catalog evidence, official participation, provenance, and research gaps."};

export default async function TrustScorecardPage(){
  const[inventory,industry]=await Promise.all([loadInventory(),loadPublicIndustry()]);const catalog=await loadCatalog(inventory);const scorecard=buildTrustCoverage({catalog,inventory,profiles:industry.profiles,registry:industry.registryRecords});
  return <main className="shell wideShell scorecardPage"><section className="scorecardHero"><div><div className="eyebrow">Cedriva Trust & Coverage Scorecard</div><h1>Measure what is known. Expose what is missing.</h1><p className="lede">This is a stewardship score—not a claim of completeness. Every metric should rise because the evidence improved, never because Cedriva lowered the standard.</p></div><div className="trustScore"><strong>{scorecard.overall}</strong><span>evidence coverage</span><small>Eight transparent dimensions</small></div></section>
    <section className="canonicalSummary"><article><strong>{scorecard.canonical.total}</strong><span>canonical records</span></article><article><strong>{scorecard.canonical.verified}</strong><span>verified foundations</span></article><article><strong>{scorecard.canonical.developing}</strong><span>developing records</span></article><article><strong>{scorecard.canonical.research}</strong><span>research required</span></article></section>
    <section className="coverageGrid">{scorecard.metrics.map(item=><a href={item.href} key={item.key}><header><span>{item.label}</span><strong>{item.score}%</strong></header><i><b style={{width:`${item.score}%`}}/></i><p>{item.detail}</p><small>{item.numerator} of {item.denominator} evidence opportunities covered</small></a>)}</section>
    <section className="scorecardPrinciples"><div><div className="eyebrow">Non-negotiable measurement rules</div><h2>Coverage serves trust. Trust never serves the score.</h2></div><ol>{scorecard.principles.map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong></li>)}</ol></section>
    <section className="scorecardActions"><article><h3>For collectors</h3><p>Add provenance, photographs, canonical identities, storage, and dated value evidence to strengthen your private record.</p><a href="/inventory-integrity">Improve my records →</a></article><article><h3>For the industry</h3><p>Verified organizations can publish factual products, releases, packaging revisions, and corrections without paying for inclusion.</p><a href="/partner-workspace">Open organization workspace →</a></article><article><h3>For Cedriva research</h3><p>Prioritize exact factories, product-level sources, blend architecture, release dates, and artifact history.</p><a href="/catalog-discovery#research-backlog">Open research backlog →</a></article></section>
  </main>;
}
