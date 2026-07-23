import { InventoryManager } from "@/components/inventory-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCatalog } from "@/lib/catalog";
import { loadRatings } from "@/lib/data";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { WorkspaceGuide } from "@/components/workspace-guide";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ missing?: string; storage?: string }> }) {
  const items = await loadInventory();
  const catalog = await loadCatalog(items);
  const filters = await searchParams;
  const mode = await accountDataMode();
  const ratings = mode === "mock" ? [] : await loadRatings();
  const plan = await loadAccountPlan();
  return <main className="shell">
    <section className="section inventoryHeader"><div><div className="eyebrow">Master collection record</div><h1>Inventory</h1><p className="lede">Add, correct, value, verify, and locate every box and individual cigar from one owner-controlled record.</p></div><div className="ctaRow"><a className="button secondary" href="/collections">View collections</a><a className="button" href="/inventory-count">Count collection</a></div></section>
    <WorkspaceGuide items={[{label:"Capture",title:"Add by camera or form",detail:"Identify a cigar, review the fields, then approve it into inventory.",href:"#mobile-intake"},{label:"Maintain",title:"Correct quantities and years",detail:"Use focused mobile edits without disturbing the rest of the record."},{label:"Protect",title:"Complete value and provenance",detail:"Close evidence gaps for reporting, verification, and climate exposure.",href:"/collection-health"}]}/>
    <UpgradeNudge plan={plan} context="inventory" usage={items.length} signals={{lotCount:items.length,portfolioValue:items.reduce((sum,item)=>sum+(item.retailValue||0)*(item.currentQty||0),0)}}/>
    <InventoryManager initialItems={items} catalog={catalog} ratings={ratings} mode={mode} initialMissing={filters.missing} initialStorage={filters.storage} />
  </main>;
}
