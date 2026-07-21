import { cigarBrands, habanosBrandSource } from "@/lib/brand-directory";
import { loadCatalog } from "@/lib/catalog";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const inventory = await loadInventory();
  const catalog = await loadCatalog(inventory);
  const regions = ["Cuba", "Dominican Republic", "Nicaragua", "Honduras", "United States", "Other"] as const;
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/inventory-count">Count collection</a><a href="/box-formats">Box formats</a></div></nav>
    <section className="verifyHero"><div><div className="eyebrow">Master catalog</div><h1>One name for every cigar.</h1><p className="lede">Canonical brands prevent duplicate spellings. Live Smartsheet records provide the line and vitola choices used during inventory entry.</p></div><div className="verifyScore"><strong>{cigarBrands.length}</strong><span>canonical brands</span><small>{catalog.length} detailed cigars in the live master catalog</small></div></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Brand directory</div><h2>Premium brands by primary region</h2></div><a className="button" href="/inventory">Add inventory</a></div><div className="brandGroups">{regions.map((region)=><article key={region}><div><h3>{region}</h3><strong>{cigarBrands.filter((brand)=>brand.region===region).length}</strong></div><p>{cigarBrands.filter((brand)=>brand.region===region).map((brand)=>brand.name).join(" · ")}</p>{region === "Cuba" && <a className="textLink" href={habanosBrandSource} target="_blank" rel="noreferrer">Official Habanos directory ↗</a>}</article>)}</div></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Smartsheet catalog</div><h2>Detailed cigar records</h2></div></div><div className="tableWrap"><table className="table"><thead><tr><th>Catalog ID</th><th>Brand</th><th>Line</th><th>Vitola</th><th>Country</th><th>Research</th></tr></thead><tbody>{catalog.sort((a,b)=>a.brand.localeCompare(b.brand)).map((item)=><tr key={item.catalogId}><td className="small">{item.catalogId}</td><td><strong>{item.brand}</strong></td><td>{item.line||"—"}</td><td>{item.vitola||"—"}</td><td>{item.country||"—"}</td><td>{item.sourceUrl?<a className="textLink" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.researchStatus||"Source"} ↗</a>:item.researchStatus||"Pending"}</td></tr>)}</tbody></table></div></section>
  </main>;
}
