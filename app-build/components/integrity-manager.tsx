"use client";
import { useMemo, useState } from "react";
import { restorableFromMaster, type IntegrityItem, type IntegrityStatus } from "@/lib/inventory-integrity";

export function IntegrityManager({ items, signedIn, duplicateCount }: { items: IntegrityItem[]; signedIn: boolean; duplicateCount: number }) {
  const [filter, setFilter] = useState<IntegrityStatus | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const visible = useMemo(() => items.filter(item => filter === "all" || item.status === filter), [items, filter]);
  const repairable = restorableFromMaster(items);

  async function restore() {
    if (!selected.length || !confirm(`Restore ${selected.length} record${selected.length === 1 ? "" : "s"} that ${selected.length === 1 ? "is" : "are"} missing from your Cedriva account? Existing account records will not be changed.`)) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/inventory-integrity/restore", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inventoryIds: selected }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(result.error || "Restore failed");
    setMessage(`${result.data.restored} records restored. Reloading the comparison…`);
    setTimeout(() => window.location.reload(), 900);
  }

  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); }

  return <section className="integrityWorkspace">
    <div className="integrityToolbar">
      <label><span>Show records</span><select value={filter} onChange={event => setFilter(event.target.value as IntegrityStatus | "all")}><option value="all">All records</option><option value="mismatch">Mismatches</option><option value="master-only">Missing from account</option><option value="account-only">Account-only</option><option value="matched">Matched</option></select></label>
      <div className="backupActions"><a className="button secondary" href="/api/inventory-integrity/backup?scope=master">Download master backup</a>{signedIn && <a className="button secondary" href="/api/inventory-integrity/backup?scope=account">Download account backup</a>}</div>
      {signedIn && <button className="button" disabled={!selected.length || busy || duplicateCount > 0} onClick={restore}>{busy ? "Restoring…" : `Restore selected (${selected.length})`}</button>}
    </div>
    {duplicateCount > 0 && <p className="integrityWarning">Restore is disabled until duplicate inventory IDs are resolved.</p>}
    {message && <output className="integrityMessage">{message}</output>}
    <div className="integrityList">
      {visible.map(item => <article key={item.inventoryId} className={`integrityRow ${item.status}`}>
        {signedIn && item.status === "master-only" ? <input type="checkbox" aria-label={`Select ${item.inventoryId}`} checked={selected.includes(item.inventoryId)} onChange={() => toggle(item.inventoryId)} /> : <span className="integrityCheck">{item.status === "matched" ? "✓" : ""}</span>}
        <div><span className={`integrityStatus ${item.status}`}>{item.status.replace("-", " ")}</span><strong>{item.identity}</strong><small>{item.inventoryId}</small></div>
        <div className="integrityDiffs">{item.differences.length ? item.differences.slice(0, 4).map(diff => <span key={diff.field}><b>{diff.label}</b> Legacy Smartsheet: {String(diff.master ?? "—")} · Cedriva account: {String(diff.account ?? "—")}</span>) : <span>{item.status === "matched" ? "All monitored fields agree" : item.status === "master-only" ? "Missing from Cedriva and available for recovery" : "Preserved in the authoritative Cedriva account"}</span>}</div>
      </article>)}
      {!visible.length && <div className="emptyState">No records match this filter.</div>}
    </div>
    {signedIn && repairable.length > 0 && <div className="selectAll"><button onClick={() => setSelected(repairable.map(item => item.inventoryId))}>Select all {repairable.length} missing records</button><span>Recovery adds missing records only. Existing Cedriva records are never overwritten.</span></div>}
  </section>;
}
