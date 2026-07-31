"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { applyTotalQuantityCorrection, hasDocumentedCurrentQuantity, inventoryCompleteness } from "@/lib/inventory-model";
import type { DataMode } from "@/lib/config";
import type { CigarCollection, InventoryItem, ProfessionalRating } from "@/lib/types";
import { lotRetailValue, retailBoxValue } from "@/lib/valuation";
import { cubanVerificationStatus, isCubanInventory } from "@/lib/cuban-verification";
import { findBoxFormat } from "@/lib/box-formats";
import { CatalogFields } from "@/components/catalog-fields";
import type { CatalogCigar } from "@/lib/types";
import { canonicalBrand } from "@/lib/brand-directory";
import { PhotoInventoryIntake } from "@/components/photo-inventory-intake";
import { ratingSummary } from "@/lib/cigar-ratings";
import { PhotoManager } from "@/components/photo-manager";
import { InventoryCorrectionAssistant } from "@/components/inventory-correction-assistant";
import { collectionContentsSummary, inventoryCollectionRelationships } from "@/lib/collection-presentation";
import { CollectionRelationshipTag } from "@/components/collection-relationship-tag";
import { brand } from "@/lib/brand";
import { recordRevision } from "@/lib/record-revision";
import { createClientUuid } from "@/lib/client-uuid";

const empty: InventoryItem = { inventoryId: "", brand: "", line: "", vitola: "", smokedQty: 0, status: "Hold", priority: "Medium" };const numberFields = new Set(["originalQty", "smokedQty", "fullBoxQty", "sticksPerBox", "looseStickQty", "retailValue", "actualCost", "score"]);const clearableFields = new Set(["catalogId","collectionId","vintage","packaging","boxCode","originalQty","smokedQty","fullBoxQty","sticksPerBox","looseStickQty","knownBoxSizes","boxFormatSourceUrl","retailValue","actualCost","storageLocationId","provenanceNotes","score","action","habanosSealPhotoLink","acquisitionSeller","acquisitionDate","acquisitionSourceUrl","acquisitionReceiptLink","purchaseJurisdiction","habanosVerificationDate","habanosVerificationResult","habanosVerificationEvidenceLink","habanosVerificationNotes","notes"]);

export function InventoryManager({ initialItems, catalog, ratings, collections, mode, initialMissing = "all", initialStorage = "all", initialCollectionId, initialActiveOnly = false }: { initialItems: InventoryItem[]; catalog: CatalogCigar[]; ratings:ProfessionalRating[]; collections:CigarCollection[]; mode: DataMode; initialMissing?: string; initialStorage?: string; initialCollectionId?: string; initialActiveOnly?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [missing, setMissing] = useState(initialMissing);
  const [storage, setStorage] = useState(initialStorage);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [editMode, setEditMode] = useState<"quantity" | "year" | "price" | "storage" | "provenance" | "all">("all");
  const [draft, setDraft] = useState<InventoryItem | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [submissionId,setSubmissionId]=useState(createClientUuid);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>();
  const [recentlySaved, setRecentlySaved] = useState<{ inventoryId: string; token: number }>();
  const [lastCreated, setLastCreated] = useState<InventoryItem | null>(null);

  useEffect(()=>{
    if(editing||draft||saving||bulkSaving)return;
    let active=true;
    async function refresh(){try{const response=await fetch("/api/inventory",{cache:"no-store"});if(!response.ok)return;const result=await response.json();if(active&&Array.isArray(result.data)){setItems(result.data);setLastSynced(new Date())}}catch{/* retain the last known inventory during a network interruption */}}
    const onFocus=()=>void refresh();
    const onVisibility=()=>{if(document.visibilityState==="visible")void refresh()};
    window.addEventListener("focus",onFocus);document.addEventListener("visibilitychange",onVisibility);void refresh();
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh()},30_000);
    return()=>{active=false;window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onVisibility);window.clearInterval(timer)};
  },[editing,draft,saving,bulkSaving]);

  useEffect(() => {
    if (!recentlySaved || editing) return;
    const frame = window.requestAnimationFrame(() => {
      const record = Array.from(document.querySelectorAll<HTMLElement>("[data-inventory-id]"))
        .find((candidate) => candidate.dataset.inventoryId === recentlySaved.inventoryId && candidate.getClientRects().length > 0);
      if (!record) return;
      record.scrollIntoView({ behavior: "smooth", block: "center" });
      record.focus({ preventScroll: true });
    });
    const timeout = window.setTimeout(() => {
      setRecentlySaved((current) => current?.token === recentlySaved.token ? undefined : current);
    }, 3500);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [recentlySaved, editing]);

  const statuses = useMemo(() => [...new Set(items.map((item) => item.status).filter(Boolean))].sort(), [items]);
  const locations = useMemo(() => [...new Set(items.map((item) => item.storageLocationId).filter(Boolean) as string[])].sort(), [items]);
  const collectionRelationships = useMemo(() => inventoryCollectionRelationships(items,collections), [items,collections]);
  const collectionContents = useMemo(() => new Map(collections.map(collection => [collection.collectionId,collectionContentsSummary(collection,items)])), [collections,items]);
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.inventoryId} ${item.brand} ${item.line} ${item.vitola}`.toLowerCase();
    const missingMatch = missing === "all" || (missing === "quantity" && !hasDocumentedCurrentQuantity(item)) || (missing === "value" && item.retailValue === undefined) || (missing === "vintage" && item.vintage === undefined) || (missing === "storage" && !item.storageLocationId) || (missing === "provenance" && !item.provenanceNotes);
    const storageMatch = storage === "all" || (storage === "unassigned" ? !item.storageLocationId : item.storageLocationId === storage);
    const collectionMatch = !initialCollectionId || item.collectionId === initialCollectionId;
    const activityMatch = !initialActiveOnly || (item.currentQty ?? 0) > 0;
    return haystack.includes(query.toLowerCase()) && (status === "all" || item.status === status) && missingMatch && storageMatch && collectionMatch && activityMatch;
  }), [items, query, status, missing, storage, initialCollectionId, initialActiveOnly]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: Record<string, unknown> = editing ? { ...editing } : {};
    for (const [key, value] of form.entries()) {
      if(key==="writeKey"||key==="quickTotal")continue;
      if(value===""){
        if(editing&&clearableFields.has(key))delete payload[key as keyof typeof payload];
        continue;
      }
      payload[key]=numberFields.has(key)?Number(value):value;
    }
    if(!editing)payload.submissionId=submissionId;
    if (editing && editMode === "year" && String(form.get("vintage") || "").trim() === "") delete payload.vintage;
    const quickTotal=String(form.get("quickTotal")||"").trim();
    if(quickTotal!=="")Object.assign(payload,applyTotalQuantityCorrection(payload as InventoryItem,Number(quickTotal)),{fullBoxQty:undefined,sticksPerBox:undefined,looseStickQty:undefined});
    if (!editing || editMode === "all") payload.habanosVerified = form.get("habanosVerified") === "on";
    payload.brand = canonicalBrand(String(payload.brand || ""));
    const id = String(payload.inventoryId);
    const isEdit = Boolean(editing);
    try {
      const response = await fetch(isEdit ? `/api/inventory/${encodeURIComponent(editing!.inventoryId)}` : "/api/inventory", {
        method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", "x-founder-key": String(form.get("writeKey") || ""), ...(editing ? { "If-Match": recordRevision(editing) } : {}) }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      setItems((current) => isEdit ? current.map((item) => item.inventoryId === editing!.inventoryId ? result.data : item) : [...current, result.data]);
      const savedId=String(result.data.inventoryId||id);
      const valuationStatus=result.valuation?.status?` ${result.valuation.status}.`:"";
      setEditing(null); setDraft(null); if(!isEdit)setSubmissionId(createClientUuid());
      const savedItem=result.data as InventoryItem;
      setMessage(isEdit?`${savedItem.brand} ${savedItem.line} was updated in your private Vault.${valuationStatus}`:`${savedItem.brand} ${savedItem.line} was saved to your private Vault. Choose what to do next below.${valuationStatus}`);
      setRecentlySaved({inventoryId:savedId,token:Date.now()});
      if(!isEdit)setLastCreated(savedItem);
      formElement.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function remove(item: InventoryItem) {
    const writeKey = window.prompt("Founder write key");
    if (writeKey === null || !window.confirm(`Delete ${item.inventoryId}? This cannot be undone.`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "DELETE", headers: { "x-founder-key": writeKey } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Delete failed");
      setItems((current) => current.filter((candidate) => candidate.inventoryId !== item.inventoryId));
      setEditing(null);
      setMessage(`${item.inventoryId} deleted.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed. Check your connection and try again.");
    }
  }

  function toggleSelected(inventoryId: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(inventoryId)) next.delete(inventoryId); else next.add(inventoryId); return next; });
  }

  function startEditing(item: InventoryItem, focus: "quantity" | "year" | "price" | "storage" | "provenance" | "all" = "all") {
    setDraft(null); setEditing(item); setEditMode(focus); setMessage("");
    window.setTimeout(() => {
      document.querySelector(".editingEditor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focus === "quantity") (document.querySelector('.editingEditor input[name="quickTotal"]') as HTMLInputElement | null)?.focus();
      if (focus === "year") (document.querySelector('.editingEditor input[name="vintage"]') as HTMLInputElement | null)?.focus();
      if (focus === "price") (document.querySelector('.editingEditor input[name="retailValue"]') as HTMLInputElement | null)?.focus();
      if (focus === "storage") (document.querySelector('.editingEditor input[name="storageLocationId"]') as HTMLInputElement | null)?.focus();
      if (focus === "provenance") (document.querySelector('.editingEditor textarea[name="provenanceNotes"]') as HTMLTextAreaElement | null)?.focus();
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
        const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-founder-key": writeKey, "If-Match": recordRevision(item) }, body: JSON.stringify(payload) });
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
  const focusedQuantity = Boolean(editing && editMode === "quantity");
  const focusedYear = Boolean(editing && editMode === "year");
  const focusedPrice = Boolean(editing && editMode === "price");
  const focusedStorage = Boolean(editing && editMode === "storage");
  const focusedProvenance = Boolean(editing && editMode === "provenance");
  const showAll = !editing || editMode === "all";
  const suggestedFormat = findBoxFormat(formItem);
  return <>
    <PhotoInventoryIntake catalog={catalog} inventory={items} mode={mode} onDraft={(item)=>{setEditing(null);setDraft(item);setMessage("");setLastCreated(null)}} onApproved={(approved)=>{setItems(current=>[...current,...approved.filter(item=>!current.some(existing=>existing.inventoryId===item.inventoryId))]);setDraft(null);const saved=approved.at(-1);if(saved){setLastCreated(saved);setRecentlySaved({inventoryId:saved.inventoryId,token:Date.now()});setMessage(`${approved.length} ${approved.length===1?"cigar record was":"cigar records were"} saved to your private Vault. Choose what to do next below.`)}}} />
    {lastCreated&&<section className="card firstRecordSuccess" aria-live="polite"><div><div className="eyebrow">Saved to your private Vault</div><h2>{lastCreated.brand} {lastCreated.line}</h2><p>Your first useful record is complete. You can stop here with confidence or add the next piece of its story.</p></div><div className="firstRecordActions"><a className="button" href={`/inventory/${encodeURIComponent(lastCreated.inventoryId)}`}>Open saved record</a><button type="button" className="button secondary" onClick={()=>startEditing(lastCreated,"storage")}>Assign storage</button>{isCubanInventory(lastCreated)&&<a className="button secondary" href="/verification">Review Habanos evidence</a>}<a className="button secondary" href="/">See my first collection insight</a><button type="button" className="textLink" onClick={()=>setLastCreated(null)}>I’m done for now</button></div></section>}
    <section className="toolbar" id="inventory-records" aria-label="Inventory records and filters">
      <label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, line, vitola, or ID" /></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>Data quality</span><select value={missing} onChange={(event) => setMissing(event.target.value)}><option value="all">All records</option><option value="quantity">Missing quantity</option><option value="value">Missing value</option><option value="vintage">Missing vintage</option><option value="storage">Missing storage</option><option value="provenance">Missing provenance</option></select></label>
      <label><span>Storage</span><select value={storage} onChange={(event) => setStorage(event.target.value)}><option value="all">All locations</option><option value="unassigned">Unassigned</option>{locations.map((value)=><option key={value}>{value}</option>)}</select></label>
      <div className="filterCount">{filtered.length} of {items.length} lots{lastSynced&&<small> · synced {lastSynced.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</small>}</div>
    </section>
    {initialCollectionId&&<section className="card inventoryDataNotice"><div><strong>{collections.find(collection=>collection.collectionId===initialCollectionId)?.name||"Selected collection"} · focused component queue</strong><p>Showing only linked lots that match the selected data-quality filter.</p></div><a className="button secondary" href={`/inventory?missing=${encodeURIComponent(missing)}#inventory-records`}>Show all matching lots</a></section>}

    {selected.size>0&&<form className="bulkInventoryBar" onSubmit={applyBulkUpdate}><div><strong>{selected.size} selected</strong><button type="button" onClick={()=>setSelected(new Set())}>Clear</button></div><label><span>Status</span><select name="bulkStatus" defaultValue=""><option value="">No change</option><option>Hold</option><option>Smoke</option><option>Preserve</option><option>Consumed</option></select></label><label><span>Storage</span><input name="bulkStorage" list="bulk-storage-options" placeholder="No change"/><datalist id="bulk-storage-options">{locations.map((value)=><option key={value}>{value}</option>)}</datalist></label><label><span>Priority</span><select name="bulkPriority" defaultValue=""><option value="">No change</option><option>Low</option><option>Medium</option><option>High</option></select></label>{mode==="smartsheet"&&<label><span>Founder write key</span><input name="writeKey" type="password" required/></label>}<button className="button" disabled={bulkSaving}>{bulkSaving?"Updating…":"Apply changes"}</button></form>}

    <section className="inventoryMobileList" aria-label="Inventory lots">{filtered.map(item=>{const relationship=collectionRelationships.get(item.inventoryId),contents=relationship?.kind==="presentation"&&relationship.collection?collectionContents.get(relationship.collection.collectionId):undefined;return <article key={item.inventoryId} data-inventory-id={item.inventoryId} data-recently-saved={recentlySaved?.inventoryId===item.inventoryId||undefined} tabIndex={-1}><div><span>{item.vintage?`Production / release year ${item.vintage}`:"Production / release year needed"} · {item.status||"Review"}</span><h3>{item.brand} {item.line}</h3><p>{item.vitola}</p><CollectionRelationshipTag relationship={relationship}/></div><div className="mobileQuantity"><strong>{contents?.documentedCigars??item.currentQty??"—"}</strong><span>{contents?"documented cigars in collection":"total cigars"}</span><small>{contents?`${contents.currentCigars} currently held · ${contents.componentLots} component lots`:`${item.fullBoxQty??0} box${item.fullBoxQty===1?"":"es"} · ${item.looseStickQty??0} loose`}</small><small>{contents?`${item.currentQty??1} presentation humidor tracked separately`:item.retailValue===undefined?"Retail value needed":`$${item.retailValue.toFixed(2)} / cigar${retailBoxValue(item)===undefined?"":` · $${retailBoxValue(item)!.toFixed(2)} / box`}`}</small></div><div className="mobileLotActions">{missing==="storage"?<button className="button" onClick={()=>startEditing(item,"storage")}>Add storage location</button>:missing==="provenance"?<button className="button" onClick={()=>startEditing(item,"provenance")}>Add provenance</button>:<><button className="button" onClick={()=>startEditing(item,"quantity")}>{contents?"Set presentation units":"Fix quantity"}</button><button className="button secondary" onClick={()=>startEditing(item,"year")}>{item.vintage?"Edit year":"Add year"}</button><button className="button secondary" onClick={()=>startEditing(item,"price")}>{contents?"Set presentation value":item.retailValue===undefined?"Add retail price":"Update retail price"}</button></>}<button className="button secondary" onClick={()=>startEditing(item)}>Edit all details</button><a href={`/inventory/${item.inventoryId}`}>Open record →</a></div></article>})}</section>
    <div className="tableWrap inventoryDesktopTable"><table className="table"><thead><tr><th><input type="checkbox" aria-label="Select visible inventory" checked={filtered.length>0&&filtered.every((item)=>selected.has(item.inventoryId))} onChange={(event)=>setSelected((current)=>{const next=new Set(current);filtered.forEach((item)=>event.target.checked?next.add(item.inventoryId):next.delete(item.inventoryId));return next})}/></th><th>ID</th><th>Cigar</th><th>Year</th><th>Owned</th><th>Total sticks</th><th>Unit retail</th><th>Box retail</th><th>Lot value</th><th>Habanos</th><th>Status</th><th>Personal</th><th>Published</th><th>Complete</th><th /></tr></thead><tbody>{filtered.map((item) => {const published=ratingSummary(ratings,item.inventoryId),relationship=collectionRelationships.get(item.inventoryId),contents=relationship?.kind==="presentation"&&relationship.collection?collectionContents.get(relationship.collection.collectionId):undefined;return <tr className={selected.has(item.inventoryId)?"selectedRow":""} key={item.inventoryId} data-inventory-id={item.inventoryId} data-recently-saved={recentlySaved?.inventoryId===item.inventoryId||undefined} tabIndex={-1}>
      <td><input type="checkbox" aria-label={`Select ${item.inventoryId}`} checked={selected.has(item.inventoryId)} onChange={()=>toggleSelected(item.inventoryId)}/></td><td className="small">{item.inventoryId}</td><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand}</strong><div className="small">{item.line} · {item.vitola}</div></a><CollectionRelationshipTag relationship={relationship}/></td><td>{item.vintage || "—"}</td><td className="small">{contents?<>{item.currentQty??1} presentation unit<br/>{contents.componentLots} component lots</>:item.fullBoxQty === undefined && item.looseStickQty === undefined ? "Total only" : <>{item.fullBoxQty ?? 0} box{item.fullBoxQty === 1 ? "" : "es"}<br />{item.looseStickQty ?? 0} loose</>}</td><td>{contents?<>{contents.documentedCigars??contents.originalCigars} documented<br/><small>{contents.currentCigars} currently held</small></>:item.currentQty ?? "—"}</td><td>{contents?"Separate":item.retailValue===undefined?"—":`$${item.retailValue.toFixed(2)}`}</td><td>{contents?"—":retailBoxValue(item)===undefined?"—":`$${retailBoxValue(item)!.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</td><td>{contents?"Separate":lotRetailValue(item)===undefined?"—":`$${lotRetailValue(item)!.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</td><td>{!isCubanInventory(item)?"—":cubanVerificationStatus(item)==="Verified"?<span className="verifyState verify-verified">Verified ✓</span>:<a href="/verification">{cubanVerificationStatus(item)}</a>}</td><td><span className={`statusPill status-${(item.status||"review").toLowerCase()}`}>{item.status || "Review"}</span></td><td>{contents?"—":item.score ?? "—"}</td><td>{contents?"—":published.highest?<a href="/ratings"><strong>{published.highest}</strong><small className="small"> {published.count} source{published.count===1?"":"s"}</small></a>:<a className="textLink" href="/ratings">Research</a>}</td><td><span className="completeness">{inventoryCompleteness(item)}%</span></td>
      <td className="rowActions">{missing==="storage"?<button onClick={()=>startEditing(item,"storage")}>Add storage</button>:missing==="provenance"?<button onClick={()=>startEditing(item,"provenance")}>Add provenance</button>:<><button onClick={() => startEditing(item,"quantity")}>Fix quantity</button><button onClick={() => startEditing(item,"price")}>Set price</button></>}<button onClick={() => startEditing(item)}>Edit all</button>{mode !== "mock" && <button className="danger" onClick={() => remove(item)}>Delete</button>}</td>
    </tr>})}</tbody></table>{filtered.length === 0 && <div className="emptyState">No inventory matches these filters.</div>}</div>

    <section className={`section editor ${editing?"editingEditor":""}`}><div className="sectionHead"><div><div className="eyebrow">{editing&&editMode==="quantity"?"Quantity correction":editing&&editMode==="year"?"Production information":editing&&editMode==="price"?"Retail price correction":"Inventory editor"}</div><h2>{editing ? `${editMode==="quantity"?"Correct quantity":editMode==="year"?"Add production / release year":editMode==="price"?"Set retail price":"Edit"} · ${editing.brand} ${editing.line}` : draft ? "Review photo-assisted draft" : "Add inventory lot"}</h2><div className="small">{editing&&editMode==="quantity"?"Enter full boxes, cigars per box, and loose sticks. Total owned recalculates automatically when saved.":editing&&editMode==="year"?"Enter the exact cigar’s four-digit production or release year. Leave it blank when the year is not verified.":editing&&editMode==="price"?"Enter the current replacement price for one cigar. Saving returns you to this inventory record; market research remains a separate workflow.":mode === "mock" ? "Private preview: existing-record edits save on this computer. New lots require a connected private vault." : mode === "supabase" ? "Changes save to your private vault." : "Changes save directly to Smartsheet."}</div></div>{(editing||draft) && <button className="button secondary" onClick={() => {setEditing(null);setDraft(null)}}>Cancel</button>}</div>
      <form key={formItem.inventoryId || "new"} className={`inventoryForm ${focusedQuantity||focusedYear||focusedPrice||focusedStorage||focusedProvenance?"focusedInventoryForm":""}`} onSubmit={submit}>
        {showAll&&<>
{editing&&<input name="inventoryId" type="hidden" value={formItem.inventoryId}/>}
<CatalogFields item={formItem} catalog={catalog} /></>}
        {(showAll||focusedYear)&&<label className={focusedYear?"yearField":undefined}><span>Production / release year</span><input name="vintage" type="number" min="1800" max="2200" inputMode="numeric" placeholder="Example: 2024" defaultValue={formItem.vintage} autoFocus={focusedYear}/><small>Use the exact cigar’s secondary band or box year. Do not copy a collection edition year onto an individual cigar.</small></label>}
        {focusedQuantity&&<label className="quantityField quickTotalField"><span>Correct total cigars now</span><input name="quickTotal" type="number" min="0" step="1" placeholder={String(formItem.currentQty??0)} inputMode="numeric" autoFocus/><small>Fastest option: enter the total currently owned. This replaces the box/loose breakdown.</small></label>}
        {(showAll||focusedQuantity)&&<><label className="quantityField"><span>Full boxes owned</span><input name="fullBoxQty" type="number" min="0" step="1" defaultValue={formItem.fullBoxQty} /></label><label className="quantityField"><span>Cigars per box</span><input name="sticksPerBox" type="number" min="1" step="1" defaultValue={formItem.sticksPerBox ?? (suggestedFormat?.sizes.length === 1 ? suggestedFormat.sizes[0] : undefined)} placeholder={formItem.knownBoxSizes || suggestedFormat?.sizes.join(", ") || "e.g. 10, 12, 20, 25"} /></label><label className="quantityField"><span>Loose sticks owned</span><input name="looseStickQty" type="number" min="0" step="1" defaultValue={formItem.looseStickQty} /></label></>}
        {showAll&&<><label><span>Known box sizes</span><input name="knownBoxSizes" defaultValue={formItem.knownBoxSizes ?? suggestedFormat?.sizes.join(", ")} placeholder="e.g. 10, 25" /></label><label><span>Box format source</span><input name="boxFormatSourceUrl" type="url" defaultValue={formItem.boxFormatSourceUrl ?? suggestedFormat?.sourceUrl} placeholder="https://…" /></label><label className="quantityField"><span>Original quantity (legacy)</span><input name="originalQty" type="number" min="0" step="1" defaultValue={formItem.originalQty} /><small>Used only when boxes and loose sticks are blank.</small></label><label className="quantityField"><span>Smoked quantity</span><input name="smokedQty" type="number" min="0" step="1" defaultValue={formItem.smokedQty} /></label></>}
        {(showAll||focusedPrice)&&<label className={focusedPrice?"priceField":undefined}><span>Retail price per cigar</span><input name="retailValue" type="number" min="0" step="0.01" defaultValue={formItem.retailValue} autoFocus={focusedPrice}/><small>Use current replacement cost for one cigar. Add source-linked market evidence separately when available.</small></label>}
        {(showAll||focusedStorage)&&<label><span>Storage location</span><input name="storageLocationId" defaultValue={formItem.storageLocationId} autoFocus={focusedStorage}/><small>Enter the humidor, cabinet, or other location where this exact lot is stored.</small></label>}
        {(showAll||focusedProvenance)&&<label className="wide"><span>Provenance notes</span><textarea name="provenanceNotes" defaultValue={formItem.provenanceNotes} rows={3} autoFocus={focusedProvenance}/><small>Record only known purchase, custody, receipt, or ownership details. Leave uncertain facts out.</small></label>}
        {showAll&&<>
        <label><span>Personal Vault score</span><input name="score" type="number" min="0" max="100" defaultValue={formItem.score} /><small>Your score; professional ratings are stored separately.</small></label>
        <label><span>Status</span><select name="status" defaultValue={formItem.status}><option>Hold</option><option>Smoke</option><option>Preserve</option><option>Consumed</option></select></label>
        <label><span>Priority</span><input name="priority" defaultValue={formItem.priority} /></label>
        <label><span>Collection membership</span><select name="collectionId" defaultValue={formItem.collectionId||""}><option value="">Standalone cigar / not assigned</option>{formItem.collectionId&&!collections.some(collection=>collection.collectionId===formItem.collectionId)&&<option value={formItem.collectionId}>{formItem.collectionId} · Current assignment</option>}{collections.map(collection=><option value={collection.collectionId} key={collection.collectionId}>{collection.name}{collection.releaseYear?` · ${collection.releaseYear}`:""}</option>)}</select><small>Choose only when this physical lot belongs to that presentation or set.</small></label>
        <label><span>Box code</span><input name="boxCode" defaultValue={formItem.boxCode} placeholder="Factory and date code" /></label>
        <label><span>Habanos seal photo URL</span><input name="habanosSealPhotoLink" type="url" defaultValue={formItem.habanosSealPhotoLink} placeholder="https://…" /></label>
        <label><span>Acquisition seller</span><input name="acquisitionSeller" defaultValue={formItem.acquisitionSeller} /></label>
        <label><span>Acquisition date</span><input name="acquisitionDate" type="date" defaultValue={formItem.acquisitionDate} /></label>
        <label><span>Purchase jurisdiction</span><input name="purchaseJurisdiction" defaultValue={formItem.purchaseJurisdiction} placeholder="Country / state / route" /></label>
        <label><span>Listing or source URL</span><input name="acquisitionSourceUrl" type="url" defaultValue={formItem.acquisitionSourceUrl} placeholder="https://…" /></label>
        <label><span>Receipt evidence URL</span><input name="acquisitionReceiptLink" type="url" defaultValue={formItem.acquisitionReceiptLink} placeholder="Private evidence link" /></label>
        <label><span>Official lookup date</span><input name="habanosVerificationDate" type="date" defaultValue={formItem.habanosVerificationDate} /></label>
        <label><span>Official lookup result</span><input name="habanosVerificationResult" defaultValue={formItem.habanosVerificationResult} placeholder="Record the exact response" /></label>
        <label><span>Lookup evidence URL</span><input name="habanosVerificationEvidenceLink" type="url" defaultValue={formItem.habanosVerificationEvidenceLink} placeholder="Private screenshot or record" /></label>
        <label className="verificationCheck"><span>Official Habanos lookup</span><span className="checkRow"><input name="habanosVerified" type="checkbox" defaultChecked={formItem.habanosVerified} /> Matching result recorded</span><small>One evidence point—not a guarantee of contents, custody, condition, seller, or legality.</small></label>
        <label className="wide"><span>Lookup and authenticity notes</span><textarea name="habanosVerificationNotes" defaultValue={formItem.habanosVerificationNotes} rows={2} /></label>
        <label className="wide"><span>Recommended action</span><input name="action" defaultValue={formItem.action} /></label>
        <label className="wide"><span>Notes</span><textarea name="notes" defaultValue={formItem.notes} rows={3} /></label></>}
        {mode === "smartsheet" && <label className="wide"><span>Founder write key *</span><input name="writeKey" type="password" required autoComplete="current-password" /></label>}
        <div className="formActions wide"><button className="button" disabled={saving || (mode === "mock" && !editing)}>{saving ? "Saving…" : editing ? "Save changes" : "Add lot"}</button>{message && <output className="inventorySaveToast">{message}</output>}</div>
      </form>
      {editing&&<InventoryCorrectionAssistant item={editing} inventory={items} mode={mode} onApplied={(updated)=>{setEditing(updated);setItems(current=>current.map(item=>item.inventoryId===updated.inventoryId?updated:item));setMessage(`${updated.inventoryId} corrected.`)}}/>}
      {editing&&<PhotoManager item={editing} onAttached={(updated)=>{setEditing(updated);setItems(current=>current.map(item=>item.inventoryId===updated.inventoryId?updated:item));}}/>}
    </section>
  </>;
}
