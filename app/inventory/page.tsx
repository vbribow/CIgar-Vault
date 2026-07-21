import { InventoryManager } from "@/components/inventory-manager";
import { dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ missing?: string; storage?: string }> }) {
  const items = await loadInventory();
  const filters = await searchParams;
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/collection-health">Collection health</a><a href="/storage">Storage</a><a href="/records">Journal & value</a><div className="badge">{items.length} lots · {dataMode()}</div></div></nav>
    <section className="section inventoryHeader"><div><h1>Inventory</h1><p className="lede">Search, review data quality, and manage every owned lot.</p></div></section>
    <InventoryManager initialItems={items} mode={dataMode()} initialMissing={filters.missing} initialStorage={filters.storage} />
  </main>;
}
