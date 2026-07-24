import { InventoryManager } from "@/components/inventory-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCatalog } from "@/lib/catalog";
import { loadCollections, loadRatings } from "@/lib/data";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { WorkspaceGuide } from "@/components/workspace-guide";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"My Collection",description:"Document, care for, understand, and preserve every box, collection, and individual cigar."};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ missing?: string; storage?: string }> }) {
  const items = await loadInventory();
  const catalog = await loadCatalog(items);
  const filters = await searchParams;
  const mode = await accountDataMode();
  const ratings = mode === "mock" ? [] : await loadRatings();
  const collections = mode === "mock" ? [] : await loadCollections();
  const plan = await loadAccountPlan();
  return <main className="shell">
    <section className="section inventoryHeader"><div><div className="eyebrow">Cedriva Vault · Your private record</div><h1>My collection</h1><p className="lede">Document every box and individual cigar, preserve provenance, understand what you own, and care for the story it carries.</p></div><div className="ctaRow"><Link className="button secondary" href="/collections" prefetch>View collections</Link><Link className="button" href="/inventory-count">Confirm my collection</Link></div></section>
    <WorkspaceGuide items={[{label:"Capture",title:"Add by camera or form",detail:"Identify a cigar, review the fields, then approve it into inventory.",href:"#mobile-intake"},{label:"Maintain",title:"Correct quantities and years",detail:"Use focused mobile edits without disturbing the rest of the record."},{label:"Protect",title:"Complete value and provenance",detail:"Close evidence gaps for reporting, verification, and climate exposure.",href:"/collection-health"}]}/>
    <UpgradeNudge plan={plan} context="inventory" usage={items.length} signals={{lotCount:items.length,portfolioValue:items.reduce((sum,item)=>sum+(item.retailValue||0)*(item.currentQty||0),0)}}/>
    <InventoryManager initialItems={items} catalog={catalog} ratings={ratings} collections={collections} mode={mode} initialMissing={filters.missing} initialStorage={filters.storage} />
  </main>;
}
