import { InventoryManager } from "@/components/inventory-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadHumidors } from "@/lib/data";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { WorkspaceGuide } from "@/components/workspace-guide";
import { brand } from "@/lib/brand";
import { cigarInventoryRecords } from "@/lib/collection-presentation";
import { recentlyAddedInventory } from "@/lib/recent-inventory";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./vault-paths.css";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"My Collection",description:"Document, care for, understand, and preserve every box, collection, and individual cigar."};

async function InventoryUpgradeNudge({ lotCount, portfolioValue }: { lotCount: number; portfolioValue: number }) {
  const plan = await loadAccountPlan().catch(() => undefined);
  return <UpgradeNudge plan={plan} context="inventory" usage={lotCount} signals={{ lotCount, portfolioValue }}/>;
}

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ missing?: string; storage?: string; status?: string; collectionId?: string; active?: string; vaultSearch?: string; inventoryId?:string; edit?: string; focus?: string;cigarName?:string;add?:string }> }) {
  const [modeResult, inventoryResult, filters] = await Promise.all([
    accountDataMode().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
    loadInventory().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
    searchParams,
  ]);
  if (!modeResult.ok || !inventoryResult.ok) {
    return <main className="shell">
      <section className="section inventoryHeader"><div><div className="eyebrow">{brand.name} Vault · Your private record</div><h1>My collection</h1><p className="lede">Document every box and individual cigar, preserve provenance, understand what you own, and care for the story it carries.</p></div></section>
      <section className="card inventoryDataNotice">
        <div className="eyebrow">Inventory records protected</div>
        <h2>Your Vault is temporarily paused.</h2>
        <p>{brand.name} could not safely verify the account and inventory record together. Nothing has been classified as missing or deleted, and no empty collection is being shown in its place.</p>
        <a className="button secondary" href="/inventory">Try again</a>
      </section>
    </main>;
  }
  const mode = modeResult.value;
  const items = inventoryResult.value;
  const [collectionsResult, humidorsResult] = await Promise.allSettled([loadCollections(), mode === "mock" ? Promise.resolve([]) : loadHumidors()]);
  const collections = collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
  const humidors = humidorsResult.status === "fulfilled" ? humidorsResult.value : [];
  const cigarItems = cigarInventoryRecords(items, collections);
  const recentItems = recentlyAddedInventory(cigarItems, 5);
  const presentationAssetCount = items.length - cigarItems.length;
  const collectionLinksReady = collectionsResult.status === "fulfilled";
  const editFocus = ["quantity","year","packaging","price","storage","provenance","rating","all"].includes(filters.focus||"")
    ? filters.focus as "quantity"|"year"|"packaging"|"price"|"storage"|"provenance"|"rating"|"all"
    : "all";
  return <main className="shell">
    <section className="section inventoryHeader"><div><div className="eyebrow">{brand.name} Vault · Your private record</div><h1>My collection</h1><p className="lede">Document every box and individual cigar, preserve provenance, understand what you own, and care for the story it carries.</p><div className="ctaRow"><Link className="button" href="/inventory?add=new#mobile-intake">Add a cigar</Link><Link className="button secondary" href="/collections#add-collection">Add a collection</Link></div></div></section>
    <nav className="vaultPaths" aria-label="Vault workspaces">
      <a href="/inventory#inventory-records"><span>Individual inventory</span><strong>Browse Vault</strong><small>View, add, and edit every box and loose cigar.</small><b>{cigarItems.length} cigar lot{cigarItems.length===1?"":"s"} →</b></a>
      <Link href="/collection-health"><span>Record integrity</span><strong>Audit My Inventory</strong><small>Review quantities, years, values, storage, provenance, and collection links.</small><b>Start audit →</b></Link>
      <Link href="/collections" prefetch><span>Named collectible sets</span><strong>Valuable Collections</strong><small>Manage exact contents, collection premiums, and humidor value.</small><b>{collectionLinksReady?`${collections.length} collection${collections.length===1?"":"s"} →`:"Records unavailable →"}</b></Link>
    </nav>
    {recentItems.length>0&&<section className="card recentlyAdded" aria-labelledby="recently-added-title"><div className="recentlyAddedHeader"><div><div className="eyebrow">Latest Vault entries</div><h2 id="recently-added-title">Recently added</h2></div><a href="/inventory#inventory-records">Browse all</a></div><ol>{recentItems.map(item=><li key={item.inventoryId}><Link href={`/inventory/${encodeURIComponent(item.inventoryId)}`}><span><strong>{item.brand} {item.line}</strong><small>{item.vitola} · {item.currentQty ?? "Quantity not recorded"}{item.collectionId?" · Collection cigar":""}</small></span><time dateTime={item.addedAt}>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(item.addedAt!))}</time></Link></li>)}</ol></section>}
    {!items.length&&<section className="card firstInventoryGuide" aria-labelledby="first-inventory-title"><div><div className="eyebrow">A focused beginning</div><h2 id="first-inventory-title">Start with one cigar—not the whole collection.</h2><p>Photograph it or enter the details you already know. Review the suggested identity, record the quantity, and save. Everything else can be added later.</p></div><a className="button" href="#mobile-intake">Document my first cigar ↓</a></section>}
    <WorkspaceGuide items={[{label:"Capture",title:"Add by camera or form",detail:"Identify a cigar, review the fields, then approve it into inventory.",href:"#mobile-intake"},{label:"Count",title:"Reconcile boxes and loose sticks",detail:"Record what is physically present without disturbing the rest of the lot.",href:"/inventory-count"},{label:"Protect",title:"Complete value and provenance",detail:"Close evidence gaps for reporting, verification, and climate exposure.",href:"/collection-health"}]}/>
    {!collectionLinksReady&&<section className="card inventoryDataNotice"><div className="eyebrow">Collection links temporarily unavailable</div><p>Your inventory is intact and available. Collection links are hidden rather than shown as absent.</p></section>}
    <Suspense fallback={null}><InventoryUpgradeNudge lotCount={cigarItems.length} portfolioValue={cigarItems.reduce((sum,item)=>sum+(item.retailValue||0)*(item.currentQty||0),0)}/></Suspense>
    {presentationAssetCount>0&&<section className="card inventoryDataNotice"><div><strong>{presentationAssetCount} presentation asset{presentationAssetCount===1?" is":"s are"} tracked separately</strong><p>Presentation humidors and cases remain connected to their collectible sets without appearing as individual cigars.</p></div><Link className="button secondary" href="/collections">Open Valuable Collections</Link></section>}
    <div><InventoryManager initialItems={cigarItems} catalog={[]} ratings={[]} collections={collections} humidors={humidors} mode={mode} initialMissing={filters.missing} initialStorage={filters.storage} initialStatus={filters.status} initialCollectionId={filters.collectionId} initialActiveOnly={filters.active === "1"} initialQuery={filters.vaultSearch||filters.inventoryId} initialEditId={filters.edit} initialEditMode={editFocus} initialIntakeQuery={filters.cigarName} initialIntakeOpen={filters.add === "new"}/></div>
  </main>;
}
