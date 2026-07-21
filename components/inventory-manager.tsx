"use client";

import { FormEvent, useMemo, useState } from "react";
import { inventoryCompleteness } from "@/lib/inventory-model";
import type { DataMode } from "@/lib/config";
import type { InventoryItem } from "@/lib/types";

const empty: InventoryItem = { inventoryId: "", brand: "", line: "", vitola: "", smokedQty: 0, status: "Hold", priority: "Medium" };
const numberFields = new Set(["originalQty", "smokedQty", "retailValue", "actualCost", "score"]);

export function InventoryManager({ initialItems, mode, initialMissing = "all", initialStorage = "all" }: { initialItems: InventoryItem[]; mode: DataMode; initialMissing?: string; initialStorage?: string }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [missing, setMissing] = useState(initialMissing);
  const [storage, setStorage] = useState(initialStorage);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const statuses = useMemo(() => [...new Set(items.map((item) => item.status).filter(Boolean))].sort(), [items]);
  const locations = useMemo(() => [...new Set(items.map((item) => item.storageLocationId).filter(Boolean) as string[])].sort(), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.inventoryId} ${item.brand} ${item.line} ${item.vitola}`.toLowerCase();
    const missingMatch = missing === "all" || (missing === "quantity" && item.originalQty === undefined) || (missing === "value" && item.retailValue === undefined) || (missing === "vintage" && item.vintage === undefined) || (missing === "storage" && !item.storageLocationId) || (missing === "provenance" && !item.provenanceNotes);
    const storageMatch = storage === "all" || (storage === "unassigned" ? !item.storageLocationId : item.storageLocationId === storage);
    return haystack.includes(query.toLowerCase()) && (status === "all" || item.status === status) && missingMatch && storageMatch;
  }), [items, query, status, missing, storage]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries([...form.entries()].flatMap(([key, value]) => key === "writeKey" || value === "" ? [] : [[key, numberFields.has(key) ? Number(value) : value]]));
    const id = String(payload.inventoryId);
    const isEdit = Boolean(editing);
    try {
      const response = await fetch(isEdit ? `/api/inventory/${encodeURIComponent(editing!.inventoryId)}` : "/api/inventory", {
        method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", "x-founder-key": String(form.get("writeKey") || "") }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      setItems((current) => isEdit ? current.map((item) => item.inventoryId === editing!.inventoryId ? result.data : item) : [...current, result.data]);
      setEditing(null); setMessage(`${id} saved.`); event.currentTarget.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function remove(item: InventoryItem) {
    const writeKey = window.prompt("Founder write key");
    if (writeKey === null || !window.confirm(`Delete ${item.inventoryId}? This cannot be undone.`)) return;
    const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "DELETE", headers: { "x-founder-key": writeKey } });
    if (response.ok) { setItems((current) => current.filter((candidate) => candidate.inventoryId !== item.inventoryId)); setEditing(null); setMessage(`${item.inventoryId} deleted.`); }
    else { const result = await response.json(); setMessage(result.error || "Delete failed"); }
  }

  const formItem = editing ?? empty;
  return <>
    <section className="toolbar" aria-label="Inventory filters">
      <label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, line, vitola, or ID" /></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>Data quality</span><select value={missing} onChange={(event) => setMissing(event.target.value)}><option value="all">All records</option><option value="quantity">Missing quantity</option><option value="value">Missing value</option><option value="vintage">Missing vintage</option><option value="storage">Missing storage</option><option value="provenance">Missing provenance</option></select></label>
      <label><span>Storage</span><select value={storage} onChange={(event) => setStorage(event.target.value)}><option value="all">All locations</option><option value="unassigned">Unassigned</option>{locations.map((value)=><option key={value}>{value}</option>)}</select></label>
      <div className="filterCount">{filtered.length} of {items.length} lots</div>
    </section>

    <div className="tableWrap"><table className="table"><thead><tr><th>ID</th><th>Cigar</th><th>Year</th><th>Qty</th><th>Status</th><th>Score</th><th>Complete</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={item.inventoryId}>
      <td className="small">{item.inventoryId}</td><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand}</strong><div className="small">{item.line} · {item.vitola}</div></a></td><td>{item.vintage || "—"}</td><td>{item.currentQty ?? "—"}</td><td><span className={`statusPill status-${(item.status||"review").toLowerCase()}`}>{item.status || "Review"}</span></td><td>{item.score ?? "—"}</td><td><span className="completeness">{inventoryCompleteness(item)}%</span></td>
      <td className="rowActions"><button onClick={() => { setEditing(item); setMessage(""); }}>Edit</button>{mode === "smartsheet" && <button className="danger" onClick={() => remove(item)}>Delete</button>}</td>
    </tr>)}</tbody></table>{filtered.length === 0 && <div className="emptyState">No inventory matches these filters.</div>}</div>

    <section className="section editor"><div className="sectionHead"><div><h2>{editing ? `Edit ${editing.inventoryId}` : "Add inventory lot"}</h2><div className="small">{mode === "mock" ? "Preview only: connect Smartsheet to enable writes." : "Changes save directly to Smartsheet."}</div></div>{editing && <button className="button secondary" onClick={() => setEditing(null)}>Cancel</button>}</div>
      <form key={formItem.inventoryId || "new"} className="inventoryForm" onSubmit={submit}>
        <label><span>Inventory ID *</span><input name="inventoryId" required defaultValue={formItem.inventoryId} readOnly={Boolean(editing)} /></label>
        <label><span>Brand *</span><input name="brand" required defaultValue={formItem.brand} /></label>
        <label><span>Line / Series</span><input name="line" defaultValue={formItem.line} /></label>
        <label><span>Vitola *</span><input name="vitola" required defaultValue={formItem.vitola} /></label>
        <label><span>Vintage</span><input name="vintage" defaultValue={formItem.vintage} /></label>
        <label><span>Original quantity</span><input name="originalQty" type="number" min="0" step="1" defaultValue={formItem.originalQty} /></label>
        <label><span>Smoked quantity</span><input name="smokedQty" type="number" min="0" step="1" defaultValue={formItem.smokedQty} /></label>
        <label><span>Replacement value</span><input name="retailValue" type="number" min="0" step="0.01" defaultValue={formItem.retailValue} /></label>
        <label><span>Score</span><input name="score" type="number" min="0" max="100" defaultValue={formItem.score} /></label>
        <label><span>Status</span><select name="status" defaultValue={formItem.status}><option>Hold</option><option>Smoke</option><option>Preserve</option><option>Consumed</option></select></label>
        <label><span>Priority</span><input name="priority" defaultValue={formItem.priority} /></label>
        <label><span>Storage location</span><input name="storageLocationId" defaultValue={formItem.storageLocationId} /></label>
        <label className="wide"><span>Recommended action</span><input name="action" defaultValue={formItem.action} /></label>
        <label className="wide"><span>Notes</span><textarea name="notes" defaultValue={formItem.notes} rows={3} /></label>
        {mode === "smartsheet" && <label className="wide"><span>Founder write key *</span><input name="writeKey" type="password" required autoComplete="current-password" /></label>}
        <div className="formActions wide"><button className="button" disabled={saving || mode === "mock"}>{saving ? "Saving…" : editing ? "Save changes" : "Add lot"}</button>{message && <output>{message}</output>}</div>
      </form>
    </section>
  </>;
}
