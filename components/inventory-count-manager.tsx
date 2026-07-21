"use client";

import { useMemo, useState } from "react";
import type { DataMode } from "@/lib/config";
import { findBoxFormat } from "@/lib/box-formats";
import type { InventoryItem } from "@/lib/types";

type CountDraft = { fullBoxQty: string; sticksPerBox: string; looseStickQty: string; storageLocationId: string };

function draftFor(item: InventoryItem): CountDraft {
  const format = findBoxFormat(item);
  return {
    fullBoxQty: item.fullBoxQty?.toString() ?? "",
    sticksPerBox: item.sticksPerBox?.toString() ?? (format?.sizes.length === 1 ? String(format.sizes[0]) : ""),
    looseStickQty: item.looseStickQty?.toString() ?? "",
    storageLocationId: item.storageLocationId ?? "",
  };
}

function isCounted(item: InventoryItem) {
  return item.fullBoxQty !== undefined && item.looseStickQty !== undefined;
}

export function InventoryCountManager({ initialItems, mode }: { initialItems: InventoryItem[]; mode: DataMode }) {
  const [items, setItems] = useState(initialItems);
  const [drafts, setDrafts] = useState<Record<string, CountDraft>>(() => Object.fromEntries(initialItems.map((item) => [item.inventoryId, draftFor(item)])));
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("uncounted");
  const [writeKey, setWriteKey] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const counted = items.filter(isCounted).length;
  const knownTotal = items.reduce((sum, item) => sum + (item.currentQty ?? 0), 0);
  const visible = useMemo(() => items.filter((item) => {
    const search = `${item.inventoryId} ${item.brand} ${item.line} ${item.vitola}`.toLowerCase();
    return search.includes(query.toLowerCase()) && (scope === "all" || (scope === "counted" ? isCounted(item) : !isCounted(item)));
  }), [items, query, scope]);

  function change(id: string, field: keyof CountDraft, value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
    setMessages((current) => ({ ...current, [id]: "" }));
  }

  async function save(item: InventoryItem) {
    const draft = drafts[item.inventoryId];
    if (draft.fullBoxQty === "" || draft.looseStickQty === "") {
      setMessages((current) => ({ ...current, [item.inventoryId]: "Enter both boxes and loose sticks. Use 0 when there are none." }));
      return;
    }
    const fullBoxQty = Number(draft.fullBoxQty);
    const looseStickQty = Number(draft.looseStickQty);
    const sticksPerBox = draft.sticksPerBox === "" ? undefined : Number(draft.sticksPerBox);
    if (fullBoxQty > 0 && !sticksPerBox) {
      setMessages((current) => ({ ...current, [item.inventoryId]: "Enter the number of cigars in each box." }));
      return;
    }
    if (!writeKey) {
      setMessages((current) => ({ ...current, [item.inventoryId]: "Enter the founder write key above first." }));
      return;
    }

    const format = findBoxFormat(item);
    const payload = {
      ...item,
      fullBoxQty,
      looseStickQty,
      sticksPerBox,
      storageLocationId: draft.storageLocationId || undefined,
      knownBoxSizes: item.knownBoxSizes ?? format?.sizes.join(", "),
      boxFormatSourceUrl: item.boxFormatSourceUrl ?? format?.sourceUrl,
    };
    setSaving(item.inventoryId);
    setMessages((current) => ({ ...current, [item.inventoryId]: "" }));
    try {
      const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-founder-key": writeKey }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.issues?.[0]?.message || result.error || "Save failed");
      setItems((current) => current.map((candidate) => candidate.inventoryId === item.inventoryId ? result.data : candidate));
      setMessages((current) => ({ ...current, [item.inventoryId]: `${result.data.currentQty} cigars saved ✓` }));
    } catch (error) {
      setMessages((current) => ({ ...current, [item.inventoryId]: error instanceof Error ? error.message : "Save failed" }));
    } finally { setSaving(null); }
  }

  return <>
    <section className="countMetrics"><article><span>Counted lots</span><strong>{counted} / {items.length}</strong><small>{Math.round(counted / Math.max(items.length, 1) * 100)}% reconciled</small></article><article><span>Known cigars</span><strong>{knownTotal.toLocaleString()}</strong><small>Across current quantities</small></article><article><span>Remaining</span><strong>{items.length - counted}</strong><small>Lots still needing a physical count</small></article></section>
    <section className="countControls"><label><span>Search collection</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, cigar, or inventory ID" /></label><label><span>Show</span><select value={scope} onChange={(event) => setScope(event.target.value)}><option value="uncounted">Needs count</option><option value="counted">Counted</option><option value="all">All lots</option></select></label><label><span>Founder write key</span><input type="password" value={writeKey} onChange={(event) => setWriteKey(event.target.value)} autoComplete="current-password" placeholder="Required to save" /></label></section>
    <section className="countList">{visible.map((item) => {
      const draft = drafts[item.inventoryId];
      const format = findBoxFormat(item);
      const preview = (Number(draft.fullBoxQty) || 0) * (Number(draft.sticksPerBox) || 0) + (Number(draft.looseStickQty) || 0);
      return <article className={`countRow ${isCounted(item) ? "counted" : ""}`} key={item.inventoryId}>
        <div className="countIdentity"><span className="eyebrow">{item.inventoryId}</span><strong>{item.brand} {item.line}</strong><small>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</small>{format && <a href={format.sourceUrl} target="_blank" rel="noreferrer">Known box: {format.sizes.join(" or ")} ↗</a>}</div>
        <label><span>Full boxes</span><input type="number" min="0" step="1" value={draft.fullBoxQty} onChange={(event) => change(item.inventoryId, "fullBoxQty", event.target.value)} placeholder="0" /></label>
        <label><span>Cigars / box</span><input type="number" min="1" step="1" value={draft.sticksPerBox} onChange={(event) => change(item.inventoryId, "sticksPerBox", event.target.value)} placeholder={format?.sizes.join(" or ") || "Size"} /></label>
        <label><span>Loose sticks</span><input type="number" min="0" step="1" value={draft.looseStickQty} onChange={(event) => change(item.inventoryId, "looseStickQty", event.target.value)} placeholder="0" /></label>
        <label><span>Storage</span><input value={draft.storageLocationId} onChange={(event) => change(item.inventoryId, "storageLocationId", event.target.value)} placeholder="Location" /></label>
        <div className="countResult"><span>On hand</span><strong>{Math.max(0, preview)}</strong><small>{item.smokedQty ?? 0} previously smoked</small></div>
        <div className="countSave"><button className="button" disabled={mode === "mock" || saving === item.inventoryId} onClick={() => save(item)}>{saving === item.inventoryId ? "Saving…" : isCounted(item) ? "Update" : "Save count"}</button>{messages[item.inventoryId] && <output>{messages[item.inventoryId]}</output>}</div>
      </article>;
    })}{visible.length === 0 && <div className="emptyState">All lots in this view are counted.</div>}</section>
  </>;
}
