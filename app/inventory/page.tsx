import { InventoryManager } from "@/components/inventory-manager";
import { dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await loadInventory();
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="badge">{items.length} lots · {dataMode()}</div></nav>
    <section className="section inventoryHeader"><div><h1>Inventory</h1><p className="lede">Search, review data quality, and manage every owned lot.</p></div></section>
    <InventoryManager initialItems={items} mode={dataMode()} />
  </main>;
}
