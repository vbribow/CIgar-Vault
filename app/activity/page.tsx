import { ActivityManager } from "@/components/activity-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadActivities } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ inventoryId?: string }>;
}) {
  const query = await searchParams;
  const mode = await accountDataMode();
  const [inventory, activities] = await Promise.all([
    loadInventory(),
    mode === "mock" ? [] : loadActivities(),
  ]);
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          Cedriva
        </a>
        <div className="navLinks">
          <a href="/inventory">Inventory</a>
          <a href="/records">Journal</a>
          <span className="badge">Activity ledger</span>
        </div>
      </nav>
      <section className="inventoryHeader">
        <div>
          <h1>Collection activity</h1>
          <p className="lede">
            A permanent record of what entered, moved through, and left your
            vault.
          </p>
        </div>
      </section>
      <ActivityManager
        inventory={inventory}
        initialActivities={activities}
        mode={mode}
        selectedId={query.inventoryId}
      />
    </main>
  );
}
