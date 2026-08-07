import { loadInventory } from "@/lib/inventory";
import { isCurrentInventoryRecord } from "@/lib/inventory-model";
import { brand } from "@/lib/brand";
import "./storage.css";

export const dynamic = "force-dynamic";

export default async function StoragePage() {
  const [inventoryResult] = await Promise.allSettled([loadInventory()]);
  if (inventoryResult.status !== "fulfilled") {
    return (
      <main className="shell">
        <nav className="nav">
          <a className="brand" href="/">{brand.name}</a>
          <div className="navLinks"><a href="/inventory">Inventory</a></div>
        </nav>
        <section className="card storageUnavailable">
          <div className="eyebrow">Storage record protected</div>
          <h1>Storage is temporarily unavailable.</h1>
          <p>
            Hojavía could not safely load your complete collection. No storage
            location has been shown as empty, and no cigar has been marked
            unassigned.
          </p>
        </section>
      </main>
    );
  }

  const items = inventoryResult.value.filter(isCurrentInventoryRecord);
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.storageLocationId || "Unassigned";
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }
  const locations = [...grouped.entries()].sort((a, b) =>
    a[0] === "Unassigned"
      ? 1
      : b[0] === "Unassigned"
        ? -1
        : a[0].localeCompare(b[0]),
  );

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">{brand.name}</a>
        <div className="navLinks">
          <a href="/inventory">Inventory</a>
          <a href="/collection-health">Collection health</a>
          <a href="/records">Journal & value</a>
        </div>
      </nav>
      <section className="section inventoryHeader">
        <div className="eyebrow">Physical collection</div>
        <h1>Storage</h1>
        <p className="lede">
          See where every current cigar lives and find the lots that still need
          a home.
        </p>
      </section>
      <section className="storageGrid">
        {locations.map(([location, lots]) => {
          const quantity = lots.reduce(
            (sum, item) => sum + (item.currentQty || 0),
            0,
          );
          return (
            <a
              className={`storageCard ${location === "Unassigned" ? "attention" : ""}`}
              href={`/inventory?storage=${encodeURIComponent(location === "Unassigned" ? "unassigned" : location)}`}
              key={location}
            >
              <div className="storageIcon">
                {location === "Unassigned"
                  ? "?"
                  : location.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="eyebrow">
                  {location === "Unassigned"
                    ? "Needs attention"
                    : "Storage location"}
                </div>
                <h2>{location}</h2>
                <p>
                  {lots.length} current lots · {quantity} known cigars
                </p>
              </div>
              <b>Open →</b>
            </a>
          );
        })}
        {!locations.length && (
          <div className="emptyState">
            No current inventory lots are available to assign.
          </div>
        )}
      </section>
    </main>
  );
}
