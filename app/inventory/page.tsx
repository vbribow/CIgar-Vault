import { InventoryManager } from "@/components/inventory-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCatalog, mergeCatalogRecords } from "@/lib/catalog";
import { loadCollections, loadRatings } from "@/lib/data";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { WorkspaceGuide } from "@/components/workspace-guide";
import type { Metadata } from "next";
import Link from "next/link";
import "./vault-paths.css";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"My Collection",description:"Document, care for, understand, and preserve every box, collection, and individual cigar."};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ missing?: string; storage?: string }> }) {
  const [modeResult, inventoryResult, filters, planResult] = await Promise.all([
    accountDataMode().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
    loadInventory().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
    searchParams,
    loadAccountPlan().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
  ]);
  if (!modeResult.ok || !inventoryResult.ok) {
    return <main className="shell">
      <section className="section inventoryHeader"><div><div className="eyebrow">Cedriva Vault · Your private record</div><h1>My collection</h1><p className="lede">Document every box and individual cigar, preserve provenance, understand what you own, and care for the story it carries.</p></div></section>
      <section className="card inventoryDataNotice">
        <div className="eyebrow">Inventory records protected</div>
        <h2>Your Vault is temporarily paused.</h2>
        <p>Cedriva could not safely verify the account and inventory record together. Nothing has been classified as missing or deleted, and no empty collection is being shown in its place.</p>
        <a className="button secondary" href="/inventory">Try again</a>
      </section>
    </main>;
  }
  const mode = modeResult.value;
  const items = inventoryResult.value;
  const [catalogResult, ratingsResult, collectionsResult] = await Promise.allSettled([
    loadCatalog(items),
    mode === "mock" ? Promise.resolve([]) : loadRatings(),
    mode === "mock" ? Promise.resolve([]) : loadCollections(),
  ]);
  const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : mergeCatalogRecords([], items);
  const ratings = ratingsResult.status === "fulfilled" ? ratingsResult.value : [];
  const collections = collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
  const collectionLinksReady = collectionsResult.status === "fulfilled";
  const relatedReady = ratingsResult.status === "fulfilled" && collectionLinksReady;
  const plan = planResult.ok ? planResult.value : undefined;
  return <main className="shell">
    <section className="section inventoryHeader"><div><div className="eyebrow">Cedriva Vault · Your private record</div><h1>My collection</h1><p className="lede">Document every box and individual cigar, preserve provenance, understand what you own, and care for the story it carries.</p></div></section>
    <nav className="vaultPaths" aria-label="Vault workspaces">
      <Link href="#inventory-records"><span>Individual inventory</span><strong>Browse Vault</strong><small>View, add, and edit every box and loose cigar.</small><b>{items.length} lots →</b></Link>
      <Link href="/inventory-count"><span>Accuracy workflow</span><strong>Audit My Inventory</strong><small>Confirm boxes, loose sticks, quantities, years, and storage.</small><b>Start audit →</b></Link>
      <Link href="/collections" prefetch><span>Named collectible sets</span><strong>Valuable Collections</strong><small>Manage exact contents, collection premiums, and humidor value.</small><b>{collectionLinksReady?`${collections.length} collections →`:"Records unavailable →"}</b></Link>
    </nav>
    <WorkspaceGuide items={[{label:"Capture",title:"Add by camera or form",detail:"Identify a cigar, review the fields, then approve it into inventory.",href:"#mobile-intake"},{label:"Maintain",title:"Correct quantities and years",detail:"Use focused mobile edits without disturbing the rest of the record.",href:"/inventory-count"},{label:"Protect",title:"Complete value and provenance",detail:"Close evidence gaps for reporting, verification, and climate exposure.",href:"/collection-health"}]}/>
    {!relatedReady&&<section className="card inventoryDataNotice"><div className="eyebrow">Supporting evidence temporarily unavailable</div><p>Your inventory is intact and available. Collection links or published ratings are temporarily hidden rather than shown as absent.</p></section>}
    <UpgradeNudge plan={plan} context="inventory" usage={items.length} signals={{lotCount:items.length,portfolioValue:items.reduce((sum,item)=>sum+(item.retailValue||0)*(item.currentQty||0),0)}}/>
    <div id="inventory-records"><InventoryManager initialItems={items} catalog={catalog} ratings={ratings} collections={collections} mode={mode} initialMissing={filters.missing} initialStorage={filters.storage} /></div>
  </main>;
}
