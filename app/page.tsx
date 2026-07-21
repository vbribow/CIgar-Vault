import { Dashboard } from "@/components/dashboard";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await loadInventory();
  return <main className="shell">
    <nav className="nav"><div className="brand">Cigar Vault</div><div className="navLinks"><a href="/inventory">Inventory</a><a href="/records">Journal & value</a><span className="badge">Founder MVP</span></div></nav>
    <section className="hero"><div><h1>Your collection, finally intelligent.</h1><p className="lede">Track provenance, aging, tasting history and value while Smartsheet remains the complete, exportable source of truth.</p><div className="ctaRow"><a className="button" href="/inventory">Open collection</a><a className="button secondary" href="/api/health">Check connection</a></div></div><div className="card"><div className="small">Launch thesis</div><h2>Premium operating system for serious cigar collectors.</h2><p className="small">MVP focus: inventory, smoking log, valuation and aging—not social features.</p></div></section>
    <Dashboard items={items} />
  </main>;
}
