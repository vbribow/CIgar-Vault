"use client";

import { FormEvent, useMemo, useState } from "react";
import { applyTotalQuantityCorrection, inventoryCompleteness } from "@/lib/inventory-model";
import type { DataMode } from "@/lib/config";
import type { InventoryItem, ProfessionalRating } from "@/lib/types";
import { lotRetailValue } from "@/lib/valuation";
import { cubanVerificationStatus, isCubanInventory } from "@/lib/cuban-verification";
import { findBoxFormat } from "@/lib/box-formats";
import { CatalogFields } from "@/components/catalog-fields";
import type { CatalogCigar } from "@/lib/types";
import { canonicalBrand } from "@/lib/brand-directory";
import { PhotoInventoryIntake } from "@/components/photo-inventory-intake";
import { ratingSummary } from "@/lib/cigar-ratings";

const empty: InventoryItem = { inventoryId: "", brand: "", line: "", vitola: "", smokedQty: 0, status: "Hold", priority: "Medium" };
const numberFields = new Set(["originalQty", "smokedQty", "fullBoxQty", "sticksPerBox", "looseStickQty", "retailValue", "actualCost", "score"]);

export function InventoryManager({ initialItems, catalog, ratings, mode, initialMissing = "all", initialStorage = "all" }: { initialItems: InventoryItem[]; catalog: CatalogCigar[]; ratings:ProfessionalRating[]; mode: DataMode; initialMissing?: string; initialStorage?: string }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [missing, setMissing] = useState(initialMissing);
  const [storage, setStorage] = useState(initialStorage);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [editMode, setEditMode] = useState<"quantity" | "all">("all");
  const [draft, setDraft] = useState<InventoryItem | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

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
    const payload: Record<string, unknown> = Object.fromEntries([...form.entries()].flatMap(([key, value]) => key === "writeKey" || key === "quickTotal" || value === "" ? [] : [[key, numberFields.has(key) ? Number(value) : value]]));
    const quickTotal=String(form.get("quickTotal")||"").trim();
    if(quickTotal!=="")Object.assign(payload,applyTotalQuantityCorrection(payload as InventoryItem,Number(quickTotal)),{fullBoxQty:undefined,sticksPerBox:undefined,looseStickQty:undefined});
    payload.habanosVerified = form.get("habanosVerified") === "on";
    payload.brand = canonicalBrand(String(payload.brand || ""));
    const id = String(payload.inventoryId);
    const isEdit = Boolean(editing);
    try {
      const response = await fetch(isEdit ? `/api/inventory/${encodeURIComponent(editing!.inventoryId)}` : "/api/inventory", {
        method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", "x-founder-key": String(form.get("writeKey") || "") }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      setItems((current) => isEdit ? current.map((item) => item.inventoryId === editing!.inventoryId ? result.data : item) : [...current, result.data]);
      setEditing(null); setDraft(null); setMessage(`${id} saved.`); event.currentTarget.reset();
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

  function toggleSelected(inventoryId: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(inventoryId)) next.delete(inventoryId); else next.add(inventoryId); return next; });
  }

  function startEditing(item: InventoryItem, focus: "quantity" | "all" = "all") {
    setDraft(null); setEditing(item); setEditMode(focus); setMessage("");
    window.setTimeout(() => {
      document.querySelector(".editingEditor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focus === "quantity") (document.querySelector('.editingEditor input[name="quickTotal"]') as HTMLInputElement | null)?.focus();
    }, 0);
  }

  async function applyBulkUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get("bulkStatus") || "");
    const storageLocationId = String(form.get("bulkStorage") || "").trim();
    const priority = String(form.get("bulkPriority") || "");
    const writeKey = String(form.get("writeKey") || "");
    if (!status && !storageLocationId && !priority) { setMessage("Choose at least one bulk change."); return; }
    const targets = items.filter((item) => selected.has(item.inventoryId));
    if (!targets.length || !window.confirm(`Apply these changes to ${targets.length} selected lot${targets.length === 1 ? "" : "s"}? Quantities will not change.`)) return;
    setBulkSaving(true); setMessage("");
    try {
      const updated: InventoryItem[] = [];
      for (const item of targets) {
        const payload = { ...item, ...(status ? { status } : {}), ...(storageLocationId ? { storageLocationId } : {}), ...(priority ? { priority } : {}) };
        const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-founder-key": writeKey }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(`${item.inventoryId}: ${result.error || "Update failed"}`);
        updated.push(result.data);
      }
      const replacements = new Map(updated.map((item) => [item.inventoryId, item]));
      setItems((current) => current.map((item) => replacements.get(item.inventoryId) || item));
      setSelected(new Set()); setMessage(`${updated.length} inventory lots updated.`); event.currentTarget.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bulk update failed"); }
    finally { setBulkSaving(false); }
  }

  const formItem = editing ?? draft ?? empty;
  const suggestedFormat = findBoxFormat(formItem);
  return <>
    <PhotoInventoryIntake catalog={catalog} inventory={items} mode={mode} onDraft={(item)=>{setEditing(null);setDraft(item);setMessage("")}} onApproved={(approved)=>{setItems(current=>[...current,...approved.filter(item=>!current.some(existing=>existing.inventoryId===item.inventoryId))]);setDraft(null)}} />
    <section className="toolbar" aria-label="Inventory filters">
      <label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, line, vitola, or ID" /></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>Data quality</span><select value={missing} onChange={(event) => setMissing(event.target.value)}><option value="all">All records</option><option value="quantity">Missing quantity</option><option value="value">Missing value</option><option value="vintage">Missing vintage</option><option value="storage">Missing storage</option><option value="provenance">Missing provenance</option></select></label>
      <label><span>Storage</span><select value={storage} onChange={(event) => setStorage(event.target.value)}><option value="all">All locations</option><option value="unassigned">Unassigned</option>{locations.map((value)=><option key={value}>{value}</option>)}</select></label>
      <div className="filterCount">{filtered.length} of {items.length} lots</div>
    </section>

    {selected.size>0&&<form className="bulkInventoryBar" onSubmit={applyBulkUpdate}><div><strong>{selected.size} selected</strong><button type="button" onClick={()=>setSelected(new Set())}>Clear</button></div><label><span>Status</span><select name="bulkStatus" defaultValue=""><option value="">No change</option><option>Hold</option><option>Smoke</option><option>Preserve</option><option>Consumed</option></select></label><label><span>Storage</span><input name="bulkStorage" list="bulk-storage-options" placeholder="No change"/><datalist id="bulk-storage-options">{locations.map((value)=><option key={value}>{value}</option>)}</datalist></label><label><span>Priority</span><select name="bulkPriority" defaultValue=""><option value="">No change</option><option>Low</option><option>Medium</option><option>High</option></select></label>{mode==="smartsheet"&&<label><span>Founder write key</span><input name="writeKey" type="password" required/></label>}<button className="button" disabled={bulkSaving}>{bulkSaving?"Updating…":"Apply changes"}</button></form>}

    <section className="inventoryMobileList" aria-label="Inventory lots">{filtered.map(item=><article key={item.inventoryId}><div><span>{item.vintage||"Year unknown"} · {item.status||"Review"}</span><h3>{item.brand} {item.line}</h3><p>{item.vitola}</p></div><div className="mobileQuantity"><strong>{item.currentQty??"—"}</strong><span>total cigars</span><small>{item.fullBoxQty??0} box{item.fullBoxQty===1?"":"es"} · {item.looseStickQty??0} loose</small></div><div className="mobileLotActions"><button className="button" onClick={()=>startEditing(item,"quantity")}>Fix quantity</button><button className="button secondary" onClick={()=>startEditing(item)}>Edit details</button><a href={`/inventory/${item.inventoryId}`}>Open record →</a></div></article>)}</section>
    <div className="tableWrap inventoryDesktopTable"><table className="table"><thead><tr><th><input type="checkbox" aria-label="Select visible inventory" checked={filtered.length>0&&filtered.every((item)=>selected.has(item.inventoryId))} onChange={(event)=>setSelected((current)=>{const next=new Set(current);filtered.forEach((item)=>event.target.checked?next.add(item.inventoryId):next.delete(item.inventoryId));return next})}/></th><th>ID</th><th>Cigar</th><th>Year</th><th>Owned</th><th>Total sticks</th><th>Unit retail</th><th>Lot value</th><th>Habanos</th><th>Status</th><th>Personal</th><th>Published</th><th>Complete</th><th /></tr></thead><tbody>{filtered.map((item) => {const published=ratingSummary(ratings,item.inventoryId);return <tr className={selected.has(item.inventoryId)?"selectedRow":""} key={item.inventoryId}>
      <td><input type="checkbox" aria-label={`Select ${item.inventoryId}`} checked={selected.has(item.inventoryId)} onChange={()=>toggleSelected(item.inventoryId)}/></td><td className="small">{item.inventoryId}</td><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand}</strong><div className="small">{item.line} · {item.vitola}</div></a></td><td>{item.vintage || "—"}</td><td className="small">{item.fullBoxQty === undefined && item.looseStickQty === undefined ? "Not split" : <>{item.fullBoxQty ?? 0} box{item.fullBoxQty === 1 ? "" : "es"}<br />{item.looseStickQty ?? 0} loose</>}</td><td>{item.currentQty ?? "—"}</td><td>{item.retailValue===undefined?"—":`$${item.retailValue.toFixed(2)}`}</td><td>{lotRetailValue(item)===undefined?"—":`$${lotRetailValue(item)!.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</td><td>{!isCubanInventory(item)?"—":cubanVerificationStatus(item)==="Verified"?<span className="verifyState verify-verified">Verified ✓</span>:<a href="/verification">{cubanVerificationStatus(item)}</a>}</td><td><span className={`statusPill status-${(item.status||"review").toLowerCase()}`}>{item.status || "Review"}</span></td><td>{item.score ?? "—"}</td><td>{published.highest?<a href="/ratings"><strong>{published.highest}</strong><small className="small"> {published.count} source{published.count===1?"":"s"}</small></a>:<a className="textLink" href="/ratings">Research</a>}</td><td><span className="completeness">{inventoryCompleteness(item)}%</span></td>
      <td className="rowActions"><button onClick={() => startEditing(item,"quantity")}>Fix quantity</button><button onClick={() => startEditing(item)}>Edit all</button>{mode !== "mock" && <button className="danger" onClick={() => remove(item)}>Delete</button>}</td>
    </tr>})}</tbody></table>{filtered.length === 0 && <div className="emptyState">No inventory matches these filters.</div>}</div>

    <section className={`section editor ${editing?"editingEditor":""}`}><div className="sectionHead"><div><div className="eyebrow">{editing&&editMode==="quantity"?"Quantity correction":"Inventory editor"}</div><h2>{editing ? `${editMode==="quantity"?"Correct quantity":"Edit"} · ${editing.brand} ${editing.line}` : draft ? "Review photo-assisted draft" : "Add inventory lot"}</h2><div className="small">{editing&&editMode==="quantity"?"Enter full boxes, cigars per box, and loose sticks. Total owned recalculates automatically when saved.":mode === "mock" ? "Preview only: connect a data source to enable writes." : mode === "supabase" ? "Changes save to your private vault." : "Changes save directly to Smartsheet."}</div></div>{(editing||draft) && <button className="button secondary" onClick={() => {setEditing(null);setDraft(null)}}>Cancel</button>}</div>
      <form key={formItem.inventoryId || "new"} className="inventoryForm" onSubmit={submit}>
        <label><span>Inventory ID *</span><input name="inventoryId" required defaultValue={formItem.inventoryId} readOnly={Boolean(editing)} /></label>
        <CatalogFields item={formItem} catalog={catalog} />
        <label><span>Vintage</span><input name="vintage" defaultValue={formItem.vintage} /></label>
        {editing&&editMode==="quantity"&&<label className="quantityField quickTotalField"><span>Correct total cigars now</span><input name="quickTotal" type="number" min="0" step="1" placeholder={String(formItem.currentQty??0)} inputMode="numeric"/><small>Fastest option: enter the total currently owned. This replaces the box/loose breakdown.</small></label>}
        <label className="quantityField"><span>Full boxes owned</span><input name="fullBoxQty" type="number" min="0" step="1" defaultValue={formItem.fullBoxQty} /></label>
        <label className="quantityField"><span>Cigars per box</span><input name="sticksPerBox" type="number" min="1" step="1" defaultValue={formItem.sticksPerBox ?? (suggestedFormat?.sizes.length === 1 ? suggestedFormat.sizes[0] : undefined)} placeholder={formItem.knownBoxSizes || suggestedFormat?.sizes.join(", ") || "e.g. 10, 12, 20, 25"} /></label>
        <label className="quantityField"><span>Loose sticks owned</span><input name="looseStickQty" type="number" min="0" step="1" defaultValue={formItem.looseStickQty} /></label>
        <label><span>Known box sizes</span><input name="knownBoxSizes" defaultValue={formItem.knownBoxSizes ?? suggestedFormat?.sizes.join(", ")} placeholder="e.g. 10, 25" /></label>
        <label><span>Box format source</span><input name="boxFormatSourceUrl" type="url" defaultValue={formItem.boxFormatSourceUrl ?? suggestedFormat?.sourceUrl} placeholder="https://…" /></label>
        <label className="quantityField"><span>Original quantity (legacy)</span><input name="originalQty" type="number" min="0" step="1" defaultValue={formItem.originalQty} /><small>Used only when boxes and loose sticks are blank.</small></label>
        <label className="quantityField"><span>Smoked quantity</span><input name="smokedQty" type="number" min="0" step="1" defaultValue={formItem.smokedQty} /></label>
        <label><span>Retail price per cigar</span><input name="retailValue" type="number" min="0" step="0.01" defaultValue={formItem.retailValue} /></label>
        <label><span>Personal Vault score</span><input name="score" type="number" min="0" max="100" defaultValue={formItem.score} /><small>Your score; professional ratings are stored separately.</small></label>
        <label><span>Status</span><select name="status" defaultValue={formItem.status}><option>Hold</option><option>Smoke</option><option>Preserve</option><option>Consumed</option></select></label>
        <label><span>Priority</span><input name="priority" defaultValue={formItem.priority} /></label>
        <label><span>Storage location</span><input name="storageLocationId" defaultValue={formItem.storageLocationId} /></label>
        <label><span>Collection ID</span><input name="collectionId" defaultValue={formItem.collectionId} placeholder="Assign in Collections" /></label>
        <label><span>Box code</span><input name="boxCode" defaultValue={formItem.boxCode} placeholder="Factory and date code" /></label>
        <label><span>Habanos seal photo URL</span><input name="habanosSealPhotoLink" type="url" defaultValue={formItem.habanosSealPhotoLink} placeholder="https://…" /></label>
        <label className="verificationCheck"><span>Habanos verification</span><span className="checkRow"><input name="habanosVerified" type="checkbox" defaultChecked={formItem.habanosVerified} /> Verified on Habanos.com</span><small>Requires both a box code and seal photo.</small></label>
        <label className="wide"><span>Recommended action</span><input name="action" defaultValue={formItem.action} /></label>
        <label className="wide"><span>Notes</span><textarea name="notes" defaultValue={formItem.notes} rows={3} /></label>
        {mode === "smartsheet" && <label className="wide"><span>Founder write key *</span><input name="writeKey" type="password" required autoComplete="current-password" /></label>}
        <div className="formActions wide"><button className="button" disabled={saving || mode === "mock"}>{saving ? "Saving…" : editing ? "Save changes" : "Add lot"}</button>{message && <output>{message}</output>}</div>
      </form>
    </section>
  </>;
}
