import type { InventoryItem } from "@/lib/types";
import { getInventory } from "@/lib/smartsheet";
import { loadAccountRecords } from "@/lib/user-data";
import { findDuplicateInventoryIds, integritySummary, reconcileInventory } from "@/lib/inventory-integrity";
import { IntegrityManager } from "@/components/integrity-manager";
import "./integrity.css";

export const dynamic = "force-dynamic";

export default async function InventoryIntegrityPage() {
  const [master, account] = await Promise.all([getInventory(), loadAccountRecords<InventoryItem>("inventory")]);
  const signedIn = account !== undefined;
  const comparison = reconcileInventory(master, account ?? []);
  const summary = integritySummary(comparison);
  const duplicates = [...findDuplicateInventoryIds(master).map(item => ({ ...item, source: "Smartsheet" })), ...findDuplicateInventoryIds(account ?? []).map(item => ({ ...item, source: "Account" }))];

  return <main className="shell wideShell integrityShell">
    <section className="integrityHero"><div><div className="eyebrow">Inventory protection</div><h1>Inventory Integrity Center.</h1><p className="lede">Compare the Smartsheet master with your private Cedriva account before anything is changed.</p></div><div className={`integrityScore ${summary.score === 100 ? "good" : "attention"}`}><strong>{summary.score}%</strong><span>records aligned</span><small>{new Date().toLocaleString()}</small></div></section>
    {!signedIn && <div className="integrityNotice">Sign in to compare your private account with the Smartsheet master. The master inventory is available for backup now.</div>}
    <section className="integrityMetrics">
      <article><span>Smartsheet master</span><strong>{master.length}</strong><small>canonical inventory lots</small></article>
      <article><span>Private account</span><strong>{signedIn ? account.length : "—"}</strong><small>{signedIn ? "account inventory lots" : "sign in to inspect"}</small></article>
      <article className={summary.mismatched ? "attention" : ""}><span>Field mismatches</span><strong>{signedIn ? summary.mismatched : "—"}</strong><small>quantity, value, identity, or storage</small></article>
      <article className={summary.masterOnly || summary.accountOnly ? "attention" : ""}><span>Missing records</span><strong>{signedIn ? summary.masterOnly + summary.accountOnly : "—"}</strong><small>{summary.masterOnly} absent from account · {summary.accountOnly} account-only</small></article>
    </section>
    <IntegrityManager items={comparison} signedIn={signedIn} duplicateCount={duplicates.length} />
    {duplicates.length > 0 && <section className="card duplicatePanel"><div className="eyebrow">Duplicate IDs</div><h2>Manual review required</h2>{duplicates.map(item => <p key={`${item.source}-${item.inventoryId}`}>{item.source}: <strong>{item.inventoryId}</strong> appears {item.count} times.</p>)}</section>}
  </main>;
}
