import { CollectionsManager } from "@/components/collections-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadValuations } from "@/lib/data";
import "../collection-catalog/catalog.css";
import "./dashboard.css";
import { WorkspaceGuide } from "@/components/workspace-guide";
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
      <WorkspaceGuide items={[{label:"Define",title:"Choose or research a set",detail:"Start from a known template or enter any named release."},{label:"Match",title:"Connect owned components",detail:"Cedriva compares expected contents with inventory."},{label:"Value",title:"Track parts and the whole",detail:"Preserve component value and complete-presentation premium."}]}/>
      <CollectionsManager
        initialCollections={collections}
        inventory={inventory}
        valuations={valuations}
        mode={mode}
      />
    </main>
  );
}
