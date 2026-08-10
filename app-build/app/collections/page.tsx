import { CollectionsManager } from "@/components/collections-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadValuations } from "@/lib/data";
import "../collection-catalog/catalog.css";
import "./dashboard.css";
import { WorkspaceGuide } from "@/components/workspace-guide";
import { brand } from "@/lib/brand";
export const dynamic = "force-dynamic";
export default async function CollectionsPage() {
  const [modeResult, inventoryResult, collectionsResult, valuationsResult] =
    await Promise.allSettled([
      accountDataMode(),
      loadInventory(),
      loadCollections(),
      loadValuations(),
    ]);
  const mode = modeResult.status === "fulfilled" ? modeResult.value : "mock";
  const inventory =
    inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
  const collections =
    collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
  const valuations =
    valuationsResult.status === "fulfilled" ? valuationsResult.value : [];
  const coreReady =
    modeResult.status === "fulfilled" &&
    inventoryResult.status === "fulfilled" &&
    collectionsResult.status === "fulfilled";
  const valuationReady = valuationsResult.status === "fulfilled";
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
          <a className="button" href="#add-collection">Add a collection</a>
        </div>
        <div className="valueHeroCard">
          <span>Collection intelligence</span>
          <strong>Whole + parts</strong>
          <small>
            Track completeness, acquisition cost, and market evidence
          </small>
        </div>
      </section>
      <WorkspaceGuide items={[{label:"Define",title:"Choose or research a set",detail:"Start from a known template or enter any named release."},{label:"Match",title:"Connect owned components",detail:`${brand.name} compares expected contents with inventory.`},{label:"Value",title:"Track parts and the whole",detail:"Preserve component value and complete-presentation premium."}]}/>
      {!coreReady ? (
        <section className="card collectionDataNotice" role="alert" aria-labelledby="collections-unavailable-title">
          <div className="eyebrow">Collection records protected</div>
          <h2 id="collections-unavailable-title">The collection workspace is temporarily paused.</h2>
          <p>
            {brand.name} could not safely load every core ownership source. No
            collection has been classified as empty, incomplete, or missing.
            Refresh after the account service recovers.
          </p>
          <a className="button secondary" href="/collections">Try again</a>
        </section>
      ) : (
        <>
          {!valuationReady && (
            <section className="card collectionDataNotice">
              <div className="eyebrow">Values temporarily unavailable</div>
              <p>
                Your collection records and component quantities are available.
                Valuation evidence is temporarily hidden rather than shown as
                zero.
              </p>
            </section>
          )}
          <CollectionsManager
            initialCollections={collections}
            inventory={inventory}
            valuations={valuations}
            mode={mode}
          />
        </>
      )}
    </main>
  );
}
