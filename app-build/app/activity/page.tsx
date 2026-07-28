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
  const [modeResult, inventoryResult] = await Promise.allSettled([
    accountDataMode(),
    loadInventory(),
  ]);
  const mode = modeResult.status === "fulfilled" ? modeResult.value : undefined;
  const activitiesResult = mode
    ? await Promise.allSettled([mode === "mock" ? Promise.resolve([]) : loadActivities()])
    : undefined;
  const ready = inventoryResult.status === "fulfilled" && mode !== undefined && activitiesResult?.[0]?.status === "fulfilled";
  const inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
  const activities = activitiesResult?.[0]?.status === "fulfilled" ? activitiesResult[0].value : [];
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          Vault
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
      {!ready?<section className="section card"><div className="eyebrow">Activity ledger protected</div><h2>Collection activity is temporarily paused.</h2><p className="small">The platform could not verify inventory and its permanent activity ledger together. No activity is being shown as absent, and no quantity-changing transaction can be written against a partial record.</p><a className="button secondary" href="/activity">Try again</a></section>:<ActivityManager
        inventory={inventory}
        initialActivities={activities}
        mode={mode!}
        selectedId={query.inventoryId}
      />}
    </main>
  );
}
