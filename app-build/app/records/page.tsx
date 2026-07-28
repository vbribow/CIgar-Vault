import { RecordsManager } from "@/components/records-manager";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadSmokingLogs, loadValuations } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ inventoryId?: string }>;
}) {
  const [{ inventoryId }, modeResult, inventoryResult] = await Promise.all([
    searchParams,
    accountDataMode().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
    loadInventory().then(value => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
  ]);
  const mode = modeResult.ok ? modeResult.value : undefined;
  const evidenceResults = mode
    ? await Promise.allSettled([
        mode === "mock" ? Promise.resolve([]) : loadSmokingLogs(),
        loadValuations(),
      ] as const)
    : undefined;
  const ready = inventoryResult.ok && mode !== undefined && evidenceResults?.every(result => result.status === "fulfilled");
  const inventory = inventoryResult.ok ? inventoryResult.value : [];
  const smokes = evidenceResults?.[0]?.status === "fulfilled" ? evidenceResults[0].value : [];
  const valuations = evidenceResults?.[1]?.status === "fulfilled" ? evidenceResults[1].value : [];
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          Vault
        </a>
        <a className="badge" href="/inventory">
          Inventory
        </a>
      </nav>
      <section className="section inventoryHeader">
        <h1>Journal & value</h1>
        <p className="lede">
          Record every smoke and preserve a dated valuation history.
        </p>
      </section>
      {!ready?<section className="section card"><div className="eyebrow">Journal records protected</div><h2>Journal and valuation entry is temporarily paused.</h2><p className="small">The platform could not verify inventory, smoking history, and valuation history together. No history is being shown as empty, and no quantity-changing entry can be made against a partial record.</p><a className="button secondary" href="/records">Try again</a></section>:<RecordsManager
        inventory={inventory}
        initialSmokes={smokes}
        initialValuations={valuations}
        mode={mode!}
        selectedInventoryId={inventoryId}
      />}
    </main>
  );
}
