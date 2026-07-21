import { CollectionsManager } from "@/components/collections-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadValuations } from "@/lib/data";
import "../collection-catalog/catalog.css";
import "./dashboard.css";
export const dynamic = "force-dynamic";
export default async function CollectionsPage() {
  const mode = await accountDataMode();
  const [inventory, collections, valuations] = await Promise.all([
    loadInventory(),
    mode === "mock" ? [] : loadCollections(),
    mode === "mock" ? [] : loadValuations(),
  ]);
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          Cigar Vault
        </a>
        <div className="navLinks">
          <a href="/inventory">Inventory</a>
          <a href="/activity">Activity</a>
          <a href="/valuations">Valuation</a>
          <span className="badge">Collections</span>
        </div>
      </nav>
      <section className="valueHero">
        <div>
          <div className="eyebrow">Curated sets</div>
          <h1>Collections worth more together.</h1>
          <p className="lede">
            Group special releases, collaborations, and collectible series while
            preserving both their component value and complete-set premium.
          </p>
        </div>
        <div className="valueHeroCard">
          <span>Collection intelligence</span>
          <strong>Whole + parts</strong>
          <small>
            Track completeness, acquisition cost, and market evidence
          </small>
        </div>
      </section>
      <CollectionsManager
        initialCollections={collections}
        inventory={inventory}
        valuations={valuations}
        mode={mode}
      />
    </main>
  );
}
