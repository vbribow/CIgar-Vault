import { InventoryCountManager } from "@/components/inventory-count-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryCountPage() {
  const items = await loadInventory();
  const mode = await accountDataMode();
  return <main className="shell wideShell">
    <nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/box-formats">Box formats</a><a href="/valuations">Valuation</a></div></nav>
    <section className="countHero"><div><div className="eyebrow">Physical reconciliation</div><h1>Count the collection.</h1><p className="lede">Enter the full boxes and loose sticks physically on hand today. Cigar Vault calculates the current total and preserves smoked history.</p></div><a className="button secondary" href="/inventory">Return to inventory</a></section>
    <InventoryCountManager initialItems={items} mode={mode} />
  </main>;
}
