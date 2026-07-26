import { InventoryCountManager } from "@/components/inventory-count-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryCountPage() {
  const [inventoryResult, modeResult] = await Promise.allSettled([loadInventory(), accountDataMode()]);
  const ready = inventoryResult.status === "fulfilled" && modeResult.status === "fulfilled";
  const items = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
  const mode = modeResult.status === "fulfilled" ? modeResult.value : undefined;
  return <main className="shell wideShell">
    <nav className="nav"><a className="brand" href="/">Cedriva</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/box-formats">Box formats</a><a href="/valuations">Valuation</a></div></nav>
    <section className="countHero"><div><div className="eyebrow">Physical reconciliation</div><h1>Count the collection.</h1><p className="lede">Enter the full boxes and loose sticks physically on hand today. Cedriva calculates the current total and preserves smoked history.</p></div><a className="button secondary" href="/inventory">Return to inventory</a></section>
    {!ready?<section className="section card"><div className="eyebrow">Physical count protected</div><h2>Counting is temporarily paused.</h2><p className="small">Cedriva could not verify the account and inventory record together. No lot is being shown as missing or uncounted, and no correction can be saved against partial data.</p><a className="button secondary" href="/inventory-count">Try again</a></section>:<InventoryCountManager initialItems={items} mode={mode!} />}
  </main>;
}
