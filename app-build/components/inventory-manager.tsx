"use client";

import { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { applyTotalQuantityCorrection, hasDocumentedCurrentQuantity, inventoryCompleteness } from "@/lib/inventory-model";
import type { DataMode } from "@/lib/config";
import type { CigarCollection, Humidor, InventoryItem, ProfessionalRating } from "@/lib/types";
import { lotRetailValue, retailBoxValue } from "@/lib/valuation";
import { cubanVerificationStatus, isCubanInventory } from "@/lib/cuban-verification";
import { findBoxFormat } from "@/lib/box-formats";
import { CatalogFields } from "@/components/catalog-fields";
import type { CatalogCigar } from "@/lib/types";
import { canonicalBrand } from "@/lib/brand-directory";
import { ratingResearchHref, ratingSummary } from "@/lib/cigar-ratings";
import { cigarInventoryRecords, collectionContentsSummary, inventoryCollectionRelationships } from "@/lib/collection-presentation";
import { CollectionRelationshipTag } from "@/components/collection-relationship-tag";
import { brand } from "@/lib/brand";
import { recordRevision } from "@/lib/record-revision";
import { createClientUuid } from "@/lib/client-uuid";
import { buildSearchResultHref } from "@/lib/search-navigation";
import { useUnsavedChanges } from "@/components/use-unsaved-changes";
import { useDeviceFormDraft } from "@/components/use-device-form-draft";
import { recentYearOptions } from "@/lib/year-options";
import { captureOperationalFailure, captureOperationalSuccess } from "@/lib/operational-failure";
import { releaseLotIntegrityIssues } from "@/lib/physical-lot-identity";
import { fetchWithTimeout, RequestTimeoutError } from "@/lib/request-control";

const PhotoInventoryIntake = dynamic(
  () => import("@/components/photo-inventory-intake").then(module => module.PhotoInventoryIntake),
  { loading: () => <section className="card deferredToolLoading" role="status" aria-live="polite"><strong>Preparing camera documentation…</strong><small>Your Vault remains available while the photo workspace loads.</small></section> },
);
const InventoryCorrectionAssistant = dynamic(
  () => import("@/components/inventory-correction-assistant").then(module => module.InventoryCorrectionAssistant),
  { loading: () => <div className="deferredToolLoading compact" role="status">Preparing correction safeguards…</div> },
);
const PhotoManager = dynamic(
  () => import("@/components/photo-manager").then(module => module.PhotoManager),
  { loading: () => <div className="deferredToolLoading compact" role="status">Preparing private attachments…</div> },
);

const empty: InventoryItem = { inventoryId: "", brand: "", line: "", vitola: "", smokedQty: 0, status: "Hold", priority: "Medium" };const numberFields = new Set(["originalQty", "smokedQty", "fullBoxQty", "sticksPerBox", "looseStickQty", "retailValue", "actualCost", "score"]);const clearableFields = new Set(["catalogId","collectionId","vintage","packaging","boxCode","originalQty","smokedQty","fullBoxQty","sticksPerBox","looseStickQty","knownBoxSizes","boxFormatSourceUrl","retailValue","actualCost","storageLocationId","provenanceNotes","score","action","habanosSealPhotoLink","acquisitionSeller","acquisitionDate","acquisitionSourceUrl","acquisitionReceiptLink","purchaseJurisdiction","habanosVerificationDate","habanosVerificationResult","habanosVerificationEvidenceLink","habanosVerificationNotes","notes"]);
const packagingOptions=["Box","Tin","Jar","Presentation humidor / case","Sampler","Bundle","Individual cigar","Other"] as const;
type EditMode="quantity"|"year"|"packaging"|"price"|"storage"|"provenance"|"rating"|"all";
const inventoryBatchSize = 30;
const vaultViewStorageKey = "hojavia:vault-view:v1";

export function InventoryManager({ initialItems, catalog, ratings, collections, humidors, mode, initialMissing = "all", initialStorage = "all", initialStatus = "all", initialCollectionId, initialActiveOnly = false, initialQuery = "", initialEditId, initialEditMode = "all",initialIntakeQuery,initialIntakeOpen=false,editorOnly=false,saveReturnHref }: { initialItems: InventoryItem[]; catalog: CatalogCigar[]; ratings:ProfessionalRating[]; collections:CigarCollection[]; humidors:Humidor[]; mode: DataMode; initialMissing?: string; initialStorage?: string; initialStatus?: string; initialCollectionId?: string; initialActiveOnly?: boolean; initialQuery?:string; initialEditId?:string; initialEditMode?:EditMode;initialIntakeQuery?:string;initialIntakeOpen?:boolean;editorOnly?:boolean;saveReturnHref?:string }) {
  const [items, setItems] = useState(initialItems);
  const requestedItem=initialEditId?initialItems.find(item=>item.inventoryId===initialEditId):undefined;
  const [query, setQuery] = useState(initialQuery||requestedItem?.inventoryId||"");
  const [queryInput, setQueryInput] = useState(initialQuery||requestedItem?.inventoryId||"");
  const [status, setStatus] = useState(initialStatus);
  const [missing, setMissing] = useState(initialMissing);
  const [storage, setStorage] = useState(initialStorage);
  const [editing, setEditing] = useState<InventoryItem | null>(requestedItem||null);
  const [editMode, setEditMode] = useState<EditMode>(initialEditMode);
  const [draft, setDraft] = useState<InventoryItem | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [submissionId,setSubmissionId]=useState(createClientUuid);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [lastSynced, setLastSynced] = useState<Date>();
  const [recentlySaved, setRecentlySaved] = useState<{ inventoryId: string; token: number }>();
  const [lastCreated, setLastCreated] = useState<InventoryItem | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(inventoryBatchSize);
  const [searchFeedback, setSearchFeedback] = useState<{ message: string; token: number }>();
  const [catalogData, setCatalogData] = useState(catalog);
  const [ratingData, setRatingData] = useState(ratings);
  const [catalogLoaded, setCatalogLoaded] = useState(catalog.length > 0);
  const [ratingsLoaded, setRatingsLoaded] = useState(ratings.length > 0);
  const [supportBusy, setSupportBusy] = useState<"catalog" | "ratings" | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [failedSupportKind, setFailedSupportKind] = useState<"catalog" | "ratings">();
  const [photoIntakeOpen, setPhotoIntakeOpen] = useState(initialIntakeOpen);
  const supportRequests = useRef({ catalog: 0, ratings: 0 });
  const inventoryRefreshRequest = useRef(0);
  const editSafety = useUnsavedChanges();
  const inventoryDraft = useDeviceFormDraft(`hojavia:form-draft:inventory:${editing?.inventoryId || "new"}:v1`);

  useEffect(() => {
    if (!initialEditId) return;
    const requested = initialItems.find((item) => item.inventoryId === initialEditId);
    if (!requested) return;
    setEditing(requested);
    setDraft(null);
    setEditMode(initialEditMode);
    setQuery(requested.inventoryId);
    setQueryInput(requested.inventoryId);
    setMessage("");
  }, [initialEditId, initialEditMode, initialItems]);

  function searchInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    setQuery(nextQuery);
    setVisibleLimit(inventoryBatchSize);
    setSearchFeedback({ message: nextQuery ? `Vault search applied for “${nextQuery}”. Results are below.` : "Showing all Vault lots below.", token: Date.now() });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = Array.from(document.querySelectorAll<HTMLElement>(".inventoryMobileList,.inventoryDesktopTable")).find(element => element.getClientRects().length > 0);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.focus({ preventScroll: true });
    }));
  }

  function clearInventorySearch() {
    setQueryInput("");
    setQuery("");
    setStatus("all");
    setMissing("all");
    setStorage("all");
    setSelected(new Set());
    setVisibleLimit(inventoryBatchSize);
    setSearchFeedback({ message: "Search and filters cleared. Showing all Vault lots.", token: Date.now() });
    if (initialCollectionId || initialActiveOnly) window.location.assign("/inventory#inventory-records");
  }

  async function loadSupport(kind: "catalog" | "ratings") {
    if ((kind === "catalog" && catalogLoaded) || (kind === "ratings" && ratingsLoaded)) return;
    const requestId = ++supportRequests.current[kind];
    setSupportBusy(kind); setSupportMessage(""); setFailedSupportKind(undefined);
    try {
      const response = await fetchWithTimeout(`/api/inventory/support?kind=${kind}`, { cache: "no-store" }, 10_000);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Supporting information is unavailable");
      if (requestId !== supportRequests.current[kind]) return;
      if (kind === "catalog") { setCatalogData(Array.isArray(result.data) ? result.data : []); setCatalogLoaded(true); }
      else { setRatingData(Array.isArray(result.data) ? result.data : []); setRatingsLoaded(true); }
    } catch (error) {
      if (requestId === supportRequests.current[kind]) { setFailedSupportKind(kind); setSupportMessage(error instanceof RequestTimeoutError ? "That support lookup is taking longer than expected. Try again when you’re ready; your Vault is unchanged." : error instanceof Error ? error.message : "Supporting information is unavailable."); }
    } finally {
      if (requestId === supportRequests.current[kind]) setSupportBusy(null);
    }
  }

  useEffect(() => {
    if (!initialIntakeOpen && window.location.hash !== "#mobile-intake") return;
    setPhotoIntakeOpen(true);
    void loadSupport("catalog");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById("mobile-intake")?.scrollIntoView({ behavior:"smooth", block:"start" })));
  }, [initialIntakeOpen]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if(editorOnly)return;
    const values = { vaultSearch: query, status, missing, storage };
    for (const [key, value] of Object.entries(values)) {
      if (value && value !== "all") url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [query, status, missing, storage,editorOnly]);

  useEffect(()=>{
    if(editing||draft||saving||bulkSaving)return;
    let active=true;
    async function refresh(){const requestId=++inventoryRefreshRequest.current;try{const response=await fetchWithTimeout("/api/inventory",{cache:"no-store"},8_000);if(!response.ok)return;const result=await response.json();if(active&&requestId===inventoryRefreshRequest.current&&Array.isArray(result.data)){setItems(cigarInventoryRecords(result.data,collections));setLastSynced(new Date())}}catch{/* retain the last known inventory during a network interruption */}}
    const onFocus=()=>void refresh();
    const onVisibility=()=>{if(document.visibilityState==="visible")void refresh()};
    window.addEventListener("focus",onFocus);document.addEventListener("visibilitychange",onVisibility);void refresh();
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh()},30_000);
    return()=>{active=false;window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onVisibility);window.clearInterval(timer)};
  },[editing,draft,saving,bulkSaving,collections]);

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
  }, [recentlySaved, editing, visibleLimit]);

  useEffect(()=>{
    if(!initialEditId||!editing)return;
    if(editorOnly&&window.location.hash!=="#inventory-editor")return;
    const frame=window.requestAnimationFrame(()=>{
      document.getElementById("inventory-editor")?.scrollIntoView({behavior:"auto",block:"start"});
      if(initialEditMode==="provenance")(document.querySelector('#inventory-editor textarea[name="provenanceNotes"]') as HTMLTextAreaElement|null)?.focus({preventScroll:true});
      if(initialEditMode==="packaging")(document.querySelector('#inventory-editor select[name="packaging"]') as HTMLSelectElement|null)?.focus({preventScroll:true});
      if(initialEditMode==="rating")(document.querySelector('#inventory-editor input[name="score"]') as HTMLInputElement|null)?.focus({preventScroll:true});
    });
    return()=>window.cancelAnimationFrame(frame);
  },[initialEditId,initialEditMode,editing,editorOnly]);

  const scopedItems = useMemo(() => cigarInventoryRecords(items, collections), [items, collections]);
  const statuses = useMemo(() => [...new Set(scopedItems.map((item) => item.status).filter(Boolean))].sort(), [scopedItems]);
  const locations = useMemo(() => [...new Set(scopedItems.map((item) => item.storageLocationId).filter(Boolean) as string[])].sort(), [scopedItems]);
  const storageOptions = useMemo(() => {
    const registered = humidors.map(humidor => ({ value: humidor.humidorId, label: humidor.name }));
    const recognized = new Set(humidors.flatMap(humidor => [humidor.humidorId, humidor.name]).map(value => value.trim().toLowerCase()));
    const legacy = locations.filter(value => !recognized.has(value.trim().toLowerCase())).map(value => ({ value, label: `${value} · legacy location` }));
    return [...registered, ...legacy];
  }, [humidors, locations]);
  const collectionRelationships = useMemo(() => inventoryCollectionRelationships(items,collections), [items,collections]);
  const collectionContents = useMemo(() => new Map(collections.map(collection => [collection.collectionId,collectionContentsSummary(collection,items)])), [collections,items]);
  const releaseLotIssues = useMemo(() => releaseLotIntegrityIssues(scopedItems), [scopedItems]);
  const releaseLotIssueIds = useMemo(() => new Set(releaseLotIssues.map(issue => issue.inventoryId)), [releaseLotIssues]);
  const releaseLotIssuesById = useMemo(() => {
    const grouped = new Map<string, typeof releaseLotIssues>();
    for (const issue of releaseLotIssues) grouped.set(issue.inventoryId, [...(grouped.get(issue.inventoryId) || []), issue]);
    return grouped;
  }, [releaseLotIssues]);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => scopedItems.filter((item) => {
    const haystack = `${item.inventoryId} ${item.brand} ${item.line} ${item.vitola}`.toLowerCase();
    const missingMatch = missing === "all" || (missing === "quantity" && !hasDocumentedCurrentQuantity(item)) || (missing === "value" && item.retailValue === undefined) || (missing === "vintage" && item.vintage === undefined) || (missing === "storage" && !item.storageLocationId) || (missing === "provenance" && !item.provenanceNotes) || (missing === "release-lot" && releaseLotIssueIds.has(item.inventoryId));
    const selectedHumidor = humidors.find(humidor => humidor.humidorId === storage);
    const storageMatch = storage === "all" || (storage === "unassigned" ? !item.storageLocationId : selectedHumidor
      ? [selectedHumidor.humidorId, selectedHumidor.name].some(value => value.trim().toLowerCase() === item.storageLocationId?.trim().toLowerCase())
      : item.storageLocationId === storage);
    const collectionMatch = !initialCollectionId || item.collectionId === initialCollectionId;
    return haystack.includes(deferredQuery.toLowerCase()) && (status === "all" || item.status === status) && missingMatch && storageMatch && collectionMatch && (!initialActiveOnly || (item.currentQty ?? 0) > 0);
  }), [scopedItems, deferredQuery, status, missing, storage, initialCollectionId, initialActiveOnly, releaseLotIssueIds, humidors]);
  const visibleItems = useMemo(() => filtered.slice(0, visibleLimit), [filtered, visibleLimit]);

  useEffect(() => setVisibleLimit(inventoryBatchSize), [deferredQuery, status, missing, storage, initialCollectionId, initialActiveOnly]);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(vaultViewStorageKey) || "null") as { href?: string; visibleLimit?: number; scrollY?: number } | null;
      if (!saved || saved.href !== `${window.location.pathname}${window.location.search}`) return;
      if (typeof saved.visibleLimit === "number") setVisibleLimit(Math.max(inventoryBatchSize, saved.visibleLimit));
      if (!window.location.hash.startsWith("#lot-") && typeof saved.scrollY === "number") window.requestAnimationFrame(() => window.scrollTo({ top: saved.scrollY!, behavior: "auto" }));
      window.sessionStorage.removeItem(vaultViewStorageKey);
    } catch { /* Vault navigation remains usable without session storage. */ }
  }, []);
  useEffect(() => {
    if (!recentlySaved) return;
    const savedIndex = filtered.findIndex(item => item.inventoryId === recentlySaved.inventoryId);
    if (savedIndex >= 0) setVisibleLimit(current => Math.max(current, savedIndex + 1));
  }, [recentlySaved, filtered]);

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
    let failureStatus=0;
    try {
      const response = await fetchWithTimeout(isEdit ? `/api/inventory/${encodeURIComponent(editing!.inventoryId)}` : "/api/inventory", {
        method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", "x-founder-key": String(form.get("writeKey") || ""), ...(editing ? { "If-Match": recordRevision(editing) } : {}) }, body: JSON.stringify(payload),
      }, 15_000);
      failureStatus=response.status;
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      void captureOperationalSuccess("inventory-save",response.status);
      setItems((current) => isEdit ? current.map((item) => item.inventoryId === editing!.inventoryId ? result.data : item) : [...current, result.data]);
      const savedId=String(result.data.inventoryId||id);
      setEditing(null); setDraft(null); if(!isEdit)setSubmissionId(createClientUuid());
      editSafety.markSaved();
      inventoryDraft.clear();
      const savedItem=result.data as InventoryItem;
      setMessage("");
      setRecentlySaved({inventoryId:savedId,token:Date.now()});
      if(!isEdit)setLastCreated(savedItem);
      formElement.reset();
      if(isEdit)window.location.assign(saveReturnHref||`/inventory/${encodeURIComponent(savedId)}?saved=inventory`);
      else window.location.assign(`/inventory/${encodeURIComponent(savedId)}?saved=inventory`);
    } catch (error) { void captureOperationalFailure("inventory-save",failureStatus);setMessage(error instanceof RequestTimeoutError ? "Saving is taking longer than expected. Your form is still here—try again when you’re ready." : error instanceof Error ? error.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function remove(item: InventoryItem) {
    const writeKey = mode === "smartsheet" ? window.prompt("Founder write key") : "";
    if (writeKey === null || !window.confirm(`Delete ${item.inventoryId} — ${item.brand} ${item.line}? This removes only this exact inventory record and cannot be undone.`)) return;
    setDeletingId(item.inventoryId);
    setMessage("");
    try {
      const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "DELETE", headers: { "x-founder-key": writeKey, "If-Match": recordRevision(item) } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Delete failed");
      setItems((current) => current.filter((candidate) => candidate.inventoryId !== item.inventoryId));
      setSelected((current)=>{const next=new Set(current);next.delete(item.inventoryId);return next});
      setEditing(null);
      setMessage(`${item.inventoryId} deleted.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed. Check your connection and try again.");
    } finally { setDeletingId(undefined); }
  }

  function toggleSelected(inventoryId: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(inventoryId)) next.delete(inventoryId); else next.add(inventoryId); return next; });
  }

  async function startEditing(item: InventoryItem, focus: EditMode = "all") {
    if (focus === "all") void loadSupport("catalog");
    setDraft(null); setEditMode(focus); setMessage("Opening the latest saved record…");
    let latest = item;
    try {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      const result = await response.json();
      if (response.ok && Array.isArray(result.data)) latest = result.data.find((candidate: InventoryItem) => candidate.inventoryId === item.inventoryId) ?? item;
    } catch { /* The existing record remains editable if refresh is temporarily unavailable. */ }
    setItems(current => current.map(candidate => candidate.inventoryId === latest.inventoryId ? latest : candidate));
    setEditing(latest); setMessage("");
    window.setTimeout(() => {
      document.querySelector(".editingEditor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focus === "quantity") (document.querySelector('.editingEditor input[name="quickTotal"]') as HTMLInputElement | null)?.focus();
      if (focus === "year") (document.querySelector('.editingEditor select[name="vintage"]') as HTMLSelectElement | null)?.focus();
      if (focus === "packaging") (document.querySelector('.editingEditor select[name="packaging"]') as HTMLSelectElement | null)?.focus();
      if (focus === "price") (document.querySelector('.editingEditor input[name="retailValue"]') as HTMLInputElement | null)?.focus();
      if (focus === "storage") (document.querySelector('.editingEditor select[name="storageLocationId"]') as HTMLSelectElement | null)?.focus();
      if (focus === "provenance") (document.querySelector('.editingEditor textarea[name="provenanceNotes"]') as HTMLTextAreaElement | null)?.focus();
    }, 0);
  }

  function recordHref(inventoryId:string) {
    const params = new URLSearchParams();
    if (query) params.set("vaultSearch", query);
    if (status !== "all") params.set("status", status);
    if (missing !== "all") params.set("missing", missing);
    if (storage !== "all") params.set("storage", storage);
    if (initialCollectionId) params.set("collectionId", initialCollectionId);
    if (initialActiveOnly) params.set("active", "1");
    const origin = `/inventory${params.size ? `?${params}` : ""}#lot-${encodeURIComponent(inventoryId)}`;
    return buildSearchResultHref(`/inventory/${encodeURIComponent(inventoryId)}`, origin, query || inventoryId);
  }

  useEffect(() => {
    const records = document.querySelectorAll<HTMLElement>("[data-inventory-id]");
    records.forEach(record => { record.removeAttribute("id"); });
    const visibleRecords = Array.from(records).filter(record => record.getClientRects().length > 0);
    visibleRecords.forEach(record => { record.id = `lot-${record.dataset.inventoryId}`; });
    const returnTarget = window.location.hash.startsWith("#lot-")
      ? document.getElementById(window.location.hash.slice(1))
      : null;
    returnTarget?.scrollIntoView({ block: "center" });
    const preserveView = (event:MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="/inventory/"]');
      const record = link?.closest<HTMLElement>("[data-inventory-id]");
      const inventoryId = record?.dataset.inventoryId;
      if (!link || !inventoryId) return;
      event.preventDefault();
      try { window.sessionStorage.setItem(vaultViewStorageKey, JSON.stringify({ href: `${window.location.pathname}${window.location.search}`, visibleLimit, scrollY: window.scrollY })); } catch { /* The return URL still preserves filters. */ }
      window.location.assign(recordHref(inventoryId));
    };
    const workspace = document.getElementById("inventory-records")?.parentElement;
    workspace?.addEventListener("click", preserveView);
    return () => workspace?.removeEventListener("click", preserveView);
  }, [query, status, missing, storage, initialCollectionId, initialActiveOnly, visibleLimit]);

  useEffect(() => {
    if (!editing && !draft) editSafety.markSaved();
  }, [editing, draft]);

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
  const focusedPackaging = Boolean(editing && editMode === "packaging");
  const focusedPrice = Boolean(editing && editMode === "price");
  const focusedStorage = Boolean(editing && editMode === "storage");
  const focusedProvenance = Boolean(editing && editMode === "provenance");
  const focusedRating = Boolean(editing && editMode === "rating");
  const showAll = !editing || editMode === "all";
  const suggestedFormat = findBoxFormat(formItem);
  const registeredStorage = humidors.find(humidor => humidor.humidorId === formItem.storageLocationId)
    ?? humidors.find(humidor => humidor.name.trim().toLowerCase() === formItem.storageLocationId?.trim().toLowerCase());
  const storageDefaultValue = registeredStorage?.humidorId ?? formItem.storageLocationId ?? "";
  return <>
    <div className="inventoryBrowseWorkspace" hidden={editorOnly||Boolean(editing||draft)}>
    {photoIntakeOpen?<PhotoInventoryIntake catalog={catalogData} inventory={items} mode={mode} initialQuery={initialIntakeQuery} startFresh={initialIntakeOpen} onDraft={(item)=>{setEditing(null);setDraft(item);setMessage("");setLastCreated(null)}} onApproved={(approved)=>{setItems(current=>[...current,...approved.filter(item=>!current.some(existing=>existing.inventoryId===item.inventoryId))]);setDraft(null);const saved=approved.at(-1);if(!saved)return;if(approved.length===1){window.location.assign(`/inventory/${encodeURIComponent(saved.inventoryId)}?saved=inventory`);return}setLastCreated(saved);setRecentlySaved({inventoryId:saved.inventoryId,token:Date.now()});setMessage(`${approved.length} cigar records were saved to your private Vault. Choose what to do next below.`)}} />:<section className="card deferredIntakeLauncher" id="mobile-intake"><div><div className="eyebrow">Camera documentation</div><h2>Add a cigar when you’re ready.</h2><p>The camera and catalog stay unloaded until you open this private workspace.</p></div><button type="button" className="button" onClick={()=>{setPhotoIntakeOpen(true);void loadSupport("catalog")}}>Open camera documentation</button></section>}
    {lastCreated&&<section className="card firstRecordSuccess" aria-live="polite"><div><div className="eyebrow">Saved to your private Vault</div><h2>{lastCreated.brand} {lastCreated.line}</h2><p>Your first useful record is complete. You can stop here with confidence or add the next piece of its story.</p></div><div className="firstRecordActions"><a className="button" href={`/inventory/${encodeURIComponent(lastCreated.inventoryId)}`}>Open saved record</a><button type="button" className="button secondary" onClick={()=>startEditing(lastCreated,"storage")}>Assign storage</button>{isCubanInventory(lastCreated)&&<a className="button secondary" href="/verification">Review Habanos evidence</a>}<a className="button secondary" href="/">See my first collection insight</a><button type="button" className="textLink" onClick={()=>setLastCreated(null)}>I’m done for now</button></div></section>}
    <section className="toolbar" id="inventory-records" aria-label="Inventory records and filters">
      <form className="inventorySearchForm" role="search" onSubmit={searchInventory}><label><span>Search existing inventory</span><input type="search" value={queryInput} onChange={(event) => { setQueryInput(event.target.value); setSearchFeedback(undefined); }} placeholder="Brand, line, vitola, or ID" /></label><button type="submit" className="button">{queryInput.trim() ? "Search Vault" : "Browse all lots"}</button></form>
      {searchFeedback&&<output key={searchFeedback.token} className="inventorySearchFeedback" role="status" aria-live="polite" aria-atomic="true">{searchFeedback.message}</output>}
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>Data quality</span><select value={missing} onChange={(event) => setMissing(event.target.value)}><option value="all">All records</option><option value="release-lot">Release / lot integrity ({releaseLotIssueIds.size})</option><option value="quantity">Missing quantity</option><option value="value">Missing value</option><option value="vintage">Missing vintage</option><option value="storage">Missing storage</option><option value="provenance">Missing provenance</option></select></label>
      <label><span>Humidor / storage</span><select value={storage} onChange={(event) => setStorage(event.target.value)}><option value="all">All humidors and locations</option><option value="unassigned">Unassigned</option>{storageOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <button type="button" className="button secondary clearInventoryFilters" onClick={clearInventorySearch} disabled={!queryInput&&!query&&status==="all"&&missing==="all"&&storage==="all"&&!initialCollectionId&&!initialActiveOnly}>Clear search and filters</button>
      <div className="filterCount">{filtered.length} of {scopedItems.length} lots{lastSynced&&<small> · synced {lastSynced.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</small>}</div>
      {!ratingsLoaded&&<button type="button" className="button secondary" disabled={supportBusy==="ratings"} onClick={()=>void loadSupport("ratings")}>{supportBusy==="ratings"?"Loading ratings…":"Load published ratings"}</button>}
    </section>
    {supportMessage&&<div className="inventoryQueueNotice" role="status">{supportMessage}{failedSupportKind&&<button type="button" className="textLink" onClick={()=>void loadSupport(failedSupportKind)}>Try again</button>}</div>}
    {message&&missing!=="all"&&<div className="inventoryQueueNotice" role="status" aria-live="polite">{message}<small>{filtered.length} record{filtered.length===1?"":"s"} currently remain in this audit view.</small></div>}
    {missing==="release-lot"&&<section className="card inventoryDataNotice" aria-live="polite"><div><strong>Check cigar names, sizes, and years</strong><p>Each box stays as its own inventory record. Confirm the exact cigar and release year before comparing values. This check never merges or deletes anything you own.</p></div><span>{releaseLotIssueIds.size} record{releaseLotIssueIds.size===1?"":"s"} need review</span></section>}
    {initialCollectionId&&<section className="card inventoryDataNotice"><div><strong>{collections.find(collection=>collection.collectionId===initialCollectionId)?.name||"Selected collection"} · focused component queue</strong><p>Showing only linked lots that match the selected data-quality filter.</p></div><a className="button secondary" href={`/inventory?missing=${encodeURIComponent(missing)}#inventory-records`}>Show all matching lots</a></section>}

    {selected.size>0&&<form className="bulkInventoryBar" onSubmit={applyBulkUpdate}><div><strong>{selected.size} selected</strong><button type="button" onClick={()=>setSelected(new Set())}>Clear</button></div><label><span>Status</span><select name="bulkStatus" defaultValue=""><option value="">No change</option><option>Hold</option><option>Smoke</option><option>Preserve</option><option>Consumed</option></select></label><label><span>Storage</span><select name="bulkStorage" defaultValue=""><option value="">No change</option>{humidors.map(humidor=><option key={humidor.humidorId} value={humidor.humidorId}>{humidor.name}</option>)}</select></label><label><span>Priority</span><select name="bulkPriority" defaultValue=""><option value="">No change</option><option>Low</option><option>Medium</option><option>High</option></select></label>{mode==="smartsheet"&&<label><span>Founder write key</span><input name="writeKey" type="password" required/></label>}<button className="button" disabled={bulkSaving||Boolean(deletingId)}>{bulkSaving?"Updating…":"Apply changes"}</button>{selected.size===1&&mode!=="mock"&&<button type="button" className="button danger bulkDeleteButton" disabled={Boolean(deletingId)} onClick={()=>{const item=items.find(candidate=>selected.has(candidate.inventoryId));if(item)void remove(item)}}>{deletingId?"Deleting…":"Delete selected record"}</button>}{selected.size>1&&<small className="bulkDeleteHint">Select one record at a time to delete.</small>}</form>}

    <section className="inventoryMobileList" aria-label="Inventory lots" tabIndex={-1}>{visibleItems.map(item=>{const relationship=collectionRelationships.get(item.inventoryId),contents=relationship?.kind==="presentation"&&relationship.collection?collectionContents.get(relationship.collection.collectionId):undefined,itemReleaseIssues=releaseLotIssuesById.get(item.inventoryId)||[];return <article key={item.inventoryId} data-inventory-id={item.inventoryId} data-recently-saved={recentlySaved?.inventoryId===item.inventoryId||undefined} tabIndex={-1}><div><span>{item.vintage?`Production / release year ${item.vintage}`:"Production / release year needed"} · {item.status||"Review"}</span><h3>{item.brand} {item.line}</h3><p>{item.vitola}</p><CollectionRelationshipTag relationship={relationship}/>{missing==="release-lot"&&itemReleaseIssues.map(issue=><small key={issue.code} className="inventoryAuditIssue">{issue.message}</small>)}</div><div className="mobileQuantity"><strong>{contents?.documentedCigars??item.currentQty??"—"}</strong><span>{contents?"documented cigars in collection":"total cigars"}</span><small>{contents?`${contents.currentCigars} currently held · ${contents.componentLots} component lots`:`${item.fullBoxQty??0} box${item.fullBoxQty===1?"":"es"} · ${item.looseStickQty??0} loose`}</small><small>{contents?`${item.currentQty??1} presentation humidor tracked separately`:item.retailValue===undefined?"Retail value needed":`$${item.retailValue.toFixed(2)} / cigar${retailBoxValue(item)===undefined?"":` · $${retailBoxValue(item)!.toFixed(2)} / box`}`}</small></div><div className="mobileLotActions">{missing==="release-lot"?<button className="button" onClick={()=>startEditing(item)}>Correct identity and release</button>:missing==="storage"?<button className="button" onClick={()=>startEditing(item,"storage")}>Add storage location</button>:missing==="provenance"?<button className="button" onClick={()=>startEditing(item,"provenance")}>Add provenance</button>:<><button className="button" onClick={()=>startEditing(item,"quantity")}>{contents?"Set presentation units":"Fix quantity"}</button><button className="button secondary" onClick={()=>startEditing(item,"year")}>{item.vintage?"Edit year":"Add year"}</button><button className="button secondary" onClick={()=>startEditing(item,"price")}>{contents?"Set presentation value":item.retailValue===undefined?"Add retail price":"Update retail price"}</button></>}<button className="button secondary" onClick={()=>startEditing(item)}>Edit all details</button><a href={`/inventory/${item.inventoryId}`}>Open record →</a></div></article>})}</section>
    <div className="tableWrap inventoryDesktopTable"><table className="table"><thead><tr><th><input type="checkbox" aria-label="Select visible inventory" checked={visibleItems.length>0&&visibleItems.every((item)=>selected.has(item.inventoryId))} onChange={(event)=>setSelected((current)=>{const next=new Set(current);visibleItems.forEach((item)=>event.target.checked?next.add(item.inventoryId):next.delete(item.inventoryId));return next})}/></th><th>ID</th><th>Cigar</th><th>Year</th><th>Owned</th><th>Total sticks</th><th>Unit retail</th><th>Box retail</th><th>Lot value</th><th>Habanos</th><th>Status</th><th>Personal</th><th>Published</th><th>Complete</th><th /></tr></thead><tbody>{visibleItems.map((item) => {const published=ratingSummary(ratingData,item.inventoryId),relationship=collectionRelationships.get(item.inventoryId),contents=relationship?.kind==="presentation"&&relationship.collection?collectionContents.get(relationship.collection.collectionId):undefined;return <tr className={selected.has(item.inventoryId)?"selectedRow":""} key={item.inventoryId} data-inventory-id={item.inventoryId} data-recently-saved={recentlySaved?.inventoryId===item.inventoryId||undefined} tabIndex={-1}>
      <td><input type="checkbox" aria-label={`Select ${item.inventoryId}`} checked={selected.has(item.inventoryId)} onChange={()=>toggleSelected(item.inventoryId)}/></td><td className="small">{item.inventoryId}</td><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand}</strong><div className="small">{item.line} · {item.vitola}</div></a><CollectionRelationshipTag relationship={relationship}/></td><td>{item.vintage || "—"}</td><td className="small">{contents?<>{item.currentQty??1} presentation unit<br/>{contents.componentLots} component lots</>:item.fullBoxQty === undefined && item.looseStickQty === undefined ? "Total only" : <>{item.fullBoxQty ?? 0} box{item.fullBoxQty === 1 ? "" : "es"}<br />{item.looseStickQty ?? 0} loose</>}</td><td>{contents?<>{contents.documentedCigars??contents.originalCigars} documented<br/><small>{contents.currentCigars} currently held</small></>:item.currentQty ?? "—"}</td><td>{contents?"Separate":item.retailValue===undefined?"—":`$${item.retailValue.toFixed(2)}`}</td><td>{contents?"—":retailBoxValue(item)===undefined?"—":`$${retailBoxValue(item)!.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</td><td>{contents?"Separate":lotRetailValue(item)===undefined?"—":`$${lotRetailValue(item)!.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</td><td>{!isCubanInventory(item)?"—":cubanVerificationStatus(item)==="Verified"?<span className="verifyState verify-verified">Verified ✓</span>:<a href="/verification">{cubanVerificationStatus(item)}</a>}</td><td><span className={`statusPill status-${(item.status||"review").toLowerCase()}`}>{item.status || "Review"}</span></td><td>{contents?"—":item.score ?? "—"}</td><td>{contents?"—":published.highest?<a href={ratingResearchHref(item.inventoryId)}><strong>{published.highest}</strong><small className="small"> {published.count} source{published.count===1?"":"s"}</small></a>:<a className="textLink" href={ratingResearchHref(item.inventoryId)}>Research</a>}</td><td><span className="completeness">{inventoryCompleteness(item)}%</span></td>
      <td className="rowActions">{missing==="storage"?<button onClick={()=>startEditing(item,"storage")}>Add storage</button>:missing==="provenance"?<button onClick={()=>startEditing(item,"provenance")}>Add provenance</button>:<><button onClick={() => startEditing(item,"quantity")}>Fix quantity</button><button onClick={() => startEditing(item,"price")}>Set price</button></>}<button onClick={() => startEditing(item)}>Edit all</button>{mode !== "mock" && <button className="danger" onClick={() => remove(item)}>Delete</button>}</td>
    </tr>})}</tbody></table>{filtered.length === 0 && <div className="emptyState">No inventory matches these filters.</div>}</div>
    {visibleItems.length < filtered.length && <div className="inventoryLoadMore" role="status" aria-live="polite"><span>Showing {visibleItems.length} of {filtered.length} matching lots.</span><button type="button" className="button secondary" onClick={() => setVisibleLimit(current => current + inventoryBatchSize)}>Show {Math.min(inventoryBatchSize, filtered.length - visibleItems.length)} more</button></div>}
    </div>

    <section id="inventory-editor" className={`section editor ${editing?"editingEditor":""} ${editorOnly?"detailInlineEditor":""}`}><div className="sectionHead"><div><div className="eyebrow">{editing&&editMode==="quantity"?"Quantity correction":editing&&editMode==="year"?"Production information":editing&&editMode==="packaging"?"Packaging information":editing&&editMode==="price"?"Retail price correction":editing&&editMode==="provenance"?"Story and provenance":"Inventory editor"}</div><h2>{editing ? `${editMode==="quantity"?"Correct quantity":editMode==="year"?"Add production / release year":editMode==="packaging"?"Document packaging":editMode==="price"?"Set retail price":editMode==="provenance"?"Edit story":"Edit all details"} · ${editing.brand} ${editing.line}` : draft ? "Review photo-assisted draft" : "Add inventory lot"}</h2><div className="small">{editing&&editMode==="quantity"?"Enter full boxes, cigars per box, and loose sticks. Total owned recalculates automatically when saved.":editing&&editMode==="year"?"Enter the exact cigar’s four-digit production or release year. Leave it blank when the year is not verified.":editing&&editMode==="packaging"?"Choose how this exact physical lot is packaged. Other record fields remain unchanged.":editing&&editMode==="price"?"Enter the current replacement price for one cigar. Saving returns you to this inventory record; market research remains a separate workflow.":editing&&editMode==="provenance"?"Update the known story for this exact lot, then save. Other record fields remain unchanged.":mode === "mock" ? "Private preview: existing-record edits save on this computer. New lots require a connected private vault." : mode === "supabase" ? "Changes save to your private vault." : "Changes save directly to Smartsheet."}</div></div>{(editing||draft) && (editorOnly?<a className="button secondary" href="#record-top">Close editor</a>:<button className="button secondary" onClick={() => {setEditing(null);setDraft(null)}}>Cancel</button>)}</div>
      {inventoryDraft.restoredFields&&<p className="deviceDraftNotice" role="status">Your unfinished inventory details were restored from this browser profile. Review them before saving.</p>}
      <form ref={inventoryDraft.formRef} key={formItem.inventoryId || "new"} className={`inventoryForm ${focusedQuantity||focusedYear||focusedPackaging||focusedPrice||focusedStorage||focusedProvenance||focusedRating?"focusedInventoryForm":""}`} onSubmit={submit} onChange={(event)=>{editSafety.markDirty();inventoryDraft.capture(event)}} onFocusCapture={()=>{if(showAll)void loadSupport("catalog")}}>
        {showAll&&<>
{editing&&<input name="inventoryId" type="hidden" value={formItem.inventoryId}/>}
<CatalogFields item={formItem} catalog={catalogData} /></>}
        {(showAll||focusedYear)&&<label className={focusedYear?"yearField":undefined}><span>Production / release year</span><select name="vintage" defaultValue={String(formItem.vintage??"")} autoFocus={focusedYear}><option value="">Choose the documented year</option>{recentYearOptions(formItem.vintage).map(year=><option key={year} value={year}>{year}</option>)}</select><small>Use the exact cigar’s secondary band or box year. Do not copy a collection edition year onto an individual cigar.</small></label>}
        {(showAll||focusedPackaging)&&<label className={focusedPackaging?"packagingField":undefined}><span>Packaging</span><select name="packaging" defaultValue={formItem.packaging||""} autoFocus={focusedPackaging}><option value="">Choose the packaging type</option>{formItem.packaging&&!packagingOptions.includes(formItem.packaging as typeof packagingOptions[number])&&<option value={formItem.packaging}>{formItem.packaging} · current description</option>}{packagingOptions.map(value=><option value={value} key={value}>{value}</option>)}</select><small>Choose the physical format for this lot. Box counts and loose-stick quantities are recorded separately.</small></label>}
        {focusedQuantity&&<label className="quantityField quickTotalField"><span>Correct total cigars now</span><input name="quickTotal" type="number" min="0" step="1" placeholder={String(formItem.currentQty??0)} inputMode="numeric" autoFocus/><small>Fastest option: enter the total currently owned. This replaces the box/loose breakdown.</small></label>}
        {(showAll||focusedQuantity)&&<><label className="quantityField"><span>Full boxes owned</span><input name="fullBoxQty" type="number" min="0" step="1" defaultValue={formItem.fullBoxQty} /></label><label className="quantityField"><span>Cigars per box</span><input name="sticksPerBox" type="number" min="1" step="1" defaultValue={formItem.sticksPerBox ?? (suggestedFormat?.sizes.length === 1 ? suggestedFormat.sizes[0] : undefined)} placeholder={formItem.knownBoxSizes || suggestedFormat?.sizes.join(", ") || "e.g. 10, 12, 20, 25"} /></label><label className="quantityField"><span>Loose sticks owned</span><input name="looseStickQty" type="number" min="0" step="1" defaultValue={formItem.looseStickQty} /></label></>}
        {showAll&&<><label><span>Known box sizes</span><input name="knownBoxSizes" defaultValue={formItem.knownBoxSizes ?? suggestedFormat?.sizes.join(", ")} placeholder="e.g. 10, 25" /></label><label><span>Box format source</span><input name="boxFormatSourceUrl" type="url" defaultValue={formItem.boxFormatSourceUrl ?? suggestedFormat?.sourceUrl} placeholder="https://…" /></label><label className="quantityField"><span>Original quantity (legacy)</span><input name="originalQty" type="number" min="0" step="1" defaultValue={formItem.originalQty} /><small>Used only when boxes and loose sticks are blank.</small></label><label className="quantityField"><span>Smoked quantity</span><input name="smokedQty" type="number" min="0" step="1" defaultValue={formItem.smokedQty} /></label></>}
        {(showAll||focusedPrice)&&<label className={focusedPrice?"priceField":undefined}><span>Retail price per cigar</span><input name="retailValue" type="number" min="0" step="0.01" defaultValue={formItem.retailValue} autoFocus={focusedPrice}/><small>Use current replacement cost for one cigar. Add source-linked market evidence separately when available.</small></label>}
        {(showAll||focusedStorage)&&<label><span>Storage location</span><select name="storageLocationId" defaultValue={storageDefaultValue} autoFocus={focusedStorage}><option value="">Not assigned</option>{formItem.storageLocationId&&!registeredStorage&&<option value={formItem.storageLocationId}>{formItem.storageLocationId} · current legacy value</option>}{humidors.map(humidor=><option key={humidor.humidorId} value={humidor.humidorId}>{humidor.name}</option>)}</select><small>Choose one of your registered humidors. The name is shown here; Hojavía saves its protected record reference.</small></label>}
        {(showAll||focusedProvenance)&&<label className="wide"><span>Purchase and ownership history</span><textarea name="provenanceNotes" defaultValue={formItem.provenanceNotes} rows={3} autoFocus={focusedProvenance}/><small>Record what you know about the purchase, seller, receipt, or prior owner. Leave uncertain details blank.</small></label>}
        {(showAll||focusedRating)&&<label><span>Personal Vault score</span><input name="score" type="number" min="0" max="100" defaultValue={formItem.score} autoFocus={focusedRating}/><small>Your score; professional ratings are stored separately.</small></label>}
        {showAll&&<>
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
        <div className="formActions wide"><button className="button" disabled={saving || (mode === "mock" && !editing)}>{saving?"Saving…":editing&&editMode==="quantity"?"Save quantity":editing&&editMode==="year"?"Save production year":editing&&editMode==="price"?"Save retail price":editing&&editMode==="storage"?"Save storage location":editing&&editMode==="provenance"?"Save provenance":editing?"Save changes":"Add lot"}</button>{message&&missing==="all"&&<output className="inventorySaveToast">{message}</output>}</div>
      </form>
      {editing&&<InventoryCorrectionAssistant item={editing} inventory={items} mode={mode} onApplied={(updated)=>{setEditing(updated);setItems(current=>current.map(item=>item.inventoryId===updated.inventoryId?updated:item));setMessage(`${updated.inventoryId} corrected.`)}}/>}
      {editing&&<PhotoManager item={editing} onAttached={(updated)=>{setEditing(updated);setItems(current=>current.map(item=>item.inventoryId===updated.inventoryId?updated:item));}}/>}
    </section>
  </>;
}
