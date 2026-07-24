import { getCatalog, getCatalogDiscoveries } from "@/lib/smartsheet";
import { dataMode } from "@/lib/config";
import { CatalogDiscoveryReview } from "@/components/catalog-discovery-review";
import { BrandResearchBacklog } from "@/components/brand-research-backlog";
import { brandResearchBacklog, brandResearchSources } from "@/lib/brand-research";
import { buildCanonicalCigarRecord, canonicalCatalogHref } from "@/lib/canonical-cigar-record";
import "./discovery.css";
import "./operations.css";
export const dynamic="force-dynamic";
export default async function CatalogDiscoveryPage({searchParams}:{searchParams:Promise<{catalogId?:string}>}){
  const {catalogId}=await searchParams;
  const [items,catalog]=dataMode()==="mock"?[[],[]]:await Promise.all([getCatalogDiscoveries(),getCatalog()]);
  const backlog=brandResearchBacklog();
  const boutiqueOpen=backlog.filter((item)=>item.priority==="Boutique priority").length;
  const focusItem=catalogId?catalog.find((item)=>item.catalogId===catalogId):undefined;
  const focus=focusItem?buildCanonicalCigarRecord(focusItem):undefined;
  return <main className="shell discoveryPage">
    <nav className="nav"><a className="brand" href="/">Cedriva</a><div className="navLinks"><a href="/learn/manufacturing-truth#all-brands">Public coverage</a><a href="/catalog">Master catalog</a><span className="badge">Founder research</span></div></nav>
    <section className="discoveryHero"><div><div className="eyebrow">Brand Discovery &amp; Verification Engine</div><h1>Find every brand. Publish only the truth.</h1><p>Cedriva continuously searches for new premium cigars, separates brand ownership from actual manufacturing, catches duplicates and renamed entities, and keeps every candidate behind founder approval.</p></div><div className="discoveryScore"><strong>{items.length}</strong><span>awaiting approval</span><small>Weekly · Monday at 12:00 UTC</small></div></section>
    <section className="researchMetrics">
      <article><strong>{catalog.length}</strong><span>approved cigar records</span></article>
      <article><strong>{backlog.length}</strong><span>open brand investigations</span></article>
      <article><strong>{boutiqueOpen}</strong><span>boutique priorities</span></article>
      <article><strong>5</strong><span>source channels monitored</span></article>
    </section>
    <section className="researchWorkflow">
      <div><span>01</span><strong>Discover</strong><p>Manufacturer, PCA, TPE, Habanos, and trade signals.</p></div>
      <div><span>02</span><strong>Classify</strong><p>Brand owner, factory brand, private label, sub-brand, or unresolved.</p></div>
      <div><span>03</span><strong>Deduplicate</strong><p>Compare canonical brand, line, vitola, aliases, and known catalog identities.</p></div>
      <div><span>04</span><strong>Verify</strong><p>Retain owner, blender, actual factory, source, date, and confidence.</p></div>
      <div><span>05</span><strong>Approve</strong><p>Nothing enters Cedriva’s public record without founder review.</p></div>
    </section>
    {focus&&<section className="catalogResearchFocus">
      <div>
        <div className="eyebrow">Active canonical research brief · {focus.catalogId}</div>
        <h2>{focus.brand} <span>{focus.line} · {focus.vitola}</span></h2>
        <p>This record is {focus.completion}% complete. Resolve fields with attributable product-level evidence; brand context must not be promoted into release fact without support.</p>
        <div className="ctaRow"><a className="button secondary" href={canonicalCatalogHref(focus.catalogId)}>Return to canonical record</a><a className="button secondary" href="#research-backlog">Compare brand backlog</a></div>
      </div>
      <div><strong>{focus.researchGaps.length} open fields</strong><div>{focus.researchGaps.map((gap)=><span key={gap}>{gap}</span>)}</div></div>
    </section>}
    <section className="approvalSection"><div className="researchSectionHead"><div><div className="eyebrow">Founder approval queue</div><h2>Evidence before publication.</h2></div><p>Edit the identity and factory fields against the source. A blank factory remains an explicit research gap; it is never inferred from the brand’s country.</p></div><CatalogDiscoveryReview initialItems={items} existingCatalog={catalog}/></section>
    <BrandResearchBacklog items={backlog}/>
    <section className="sourceRegistry"><div className="researchSectionHead"><div><div className="eyebrow">Monitoring registry</div><h2>Signals lead. Sources prove.</h2></div><p>Trade-show and publication coverage can surface a candidate. Cedriva still prefers direct manufacturer evidence before publishing ownership or manufacturing claims.</p></div><div>{brandResearchSources.map((source)=><a key={source.name} href={source.href} target={source.href.startsWith("http")?"_blank":undefined} rel={source.href.startsWith("http")?"noreferrer":undefined}><span>{source.kind} · {source.cadence}</span><h3>{source.name}</h3><p>{source.use}</p><strong>Open source ↗</strong></a>)}</div></section>
  </main>
}
