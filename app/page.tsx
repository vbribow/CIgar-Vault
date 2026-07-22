import { Dashboard } from "@/components/dashboard";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await loadInventory();
  return <main className="shell">
    <section className="hero productHero"><div><div className="eyebrow">Private collection intelligence</div><h1>Know every cigar. Protect the whole collection.</h1><p className="lede">Cigar Vault brings inventory, collectible sets, current values, provenance, storage climate, and acquisition planning into one collector-controlled record.</p><div className="ctaRow"><a className="button" href="/inventory">Open inventory</a><a className="button secondary" href="/reports">View collection report</a></div></div><div className="card productPromise"><div className="eyebrow">Built for the collection itself</div><h2>From individual cigar to complete vault.</h2><p>Count boxes and loose cigars, verify Cuban packaging, research replacement value, monitor humidors, and preserve an exportable record.</p><div className="trustLine"><span>Private account records</span><span>Smartsheet-compatible</span><span>Downloadable backups</span></div></div></section>
    <Dashboard items={items} />
  </main>;
}
