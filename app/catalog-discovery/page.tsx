import { getCatalogDiscoveries } from "@/lib/smartsheet";
import { dataMode } from "@/lib/config";
import { CatalogDiscoveryReview } from "@/components/catalog-discovery-review";
import "./discovery.css";
export const dynamic="force-dynamic";
export default async function CatalogDiscoveryPage(){const items=dataMode()==="mock"?[]:await getCatalogDiscoveries();return <main className="shell discoveryPage"><nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/catalog">Master catalog</a><span className="badge">AI discovery</span></div></nav><section className="discoveryHero"><div><div className="eyebrow">Continuous catalog intelligence</div><h1>New cigars, reviewed before they go live.</h1><p>A weekly AI research job searches trusted web sources for newly announced brands, blends, and vitolas. Candidates stay out of inventory dropdowns until explicitly approved.</p></div><div className="discoveryScore"><strong>{items.length}</strong><span>awaiting review</span><small>Weekly · Monday at 12:00 UTC</small></div></section><CatalogDiscoveryReview initialItems={items}/></main>}
