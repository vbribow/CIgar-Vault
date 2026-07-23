"use client";

import { FormEvent, useMemo, useState } from "react";
import type { DataMode } from "@/lib/config";
import { normalizeManualRetailPrice } from "@/lib/retail-pricing";
import type { InventoryItem } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number | undefined) => value === undefined ? "—" : value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function RetailPricingControls({ items, mode, initialInventoryId }: { items: InventoryItem[]; mode: DataMode; initialInventoryId?: string }) {
  const [inventoryId, setInventoryId] = useState(items.some(item => item.inventoryId === initialInventoryId) ? initialInventoryId! : items[0]?.inventoryId ?? "");
  const [basis, setBasis] = useState<"Per cigar" | "Full box">("Per cigar");
  const [price, setPrice] = useState("");
  const [sticksPerBox, setSticksPerBox] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [writeKey, setWriteKey] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const selected = useMemo(() => items.find(item => item.inventoryId === inventoryId), [inventoryId, items]);
  const normalized = useMemo(() => {
    try {
      if (price === "") return undefined;
      return normalizeManualRetailPrice({ basis, price: Number(price), sticksPerBox: sticksPerBox ? Number(sticksPerBox) : selected?.sticksPerBox });
    } catch {
      return undefined;
    }
  }, [basis, price, selected?.sticksPerBox, sticksPerBox]);

  async function autofill() {
    setBusy("autofill"); setMessage("");
    try {
      const response = await fetch("/api/retail-prices/autofill", { method: "POST", headers: { ...(writeKey ? { "x-founder-key": writeKey } : {}) } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Autofill failed");
      setMessage(result.data.updated ? `${result.data.updated} exact-match retail price${result.data.updated === 1 ? "" : "s"} applied. Refreshing…` : "No additional exact-match retail prices are available yet.");
      if (result.data.updated) window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Autofill failed");
    } finally {
      setBusy("");
    }
  }

  async function saveManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("manual"); setMessage("");
    try {
      if (!selected) throw new Error("Choose a cigar.");
      const values = normalizeManualRetailPrice({ basis, price: Number(price), sticksPerBox: sticksPerBox ? Number(sticksPerBox) : selected.sticksPerBox });
      const response = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(writeKey ? { "x-founder-key": writeKey } : {}) },
        body: JSON.stringify({
          valuationId: `VAL-MANUAL-${selected.inventoryId}-${Date.now().toString(36).toUpperCase()}`,
          inventoryId: selected.inventoryId,
          valuationDate: today(),
          replacementValue: Math.round(values.unitPrice * 100) / 100,
          source: source.trim() || "Collector manual retail entry",
          sourceUrl: sourceUrl.trim() || undefined,
          confidence: sourceUrl.trim() ? "Medium" : "Community",
          notes: basis === "Full box"
            ? `Manual retail box price ${money(values.boxPrice)} normalized across ${sticksPerBox || selected.sticksPerBox} cigars.`
            : `Manual retail price entered per cigar${values.boxPrice === undefined ? "." : `; calculated box retail ${money(values.boxPrice)}.`}`,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Manual price save failed");
      setMessage(`Saved ${money(values.unitPrice)} per cigar${values.boxPrice === undefined ? "" : ` · ${money(values.boxPrice)} per box`}. Refreshing…`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Manual price save failed");
    } finally {
      setBusy("");
    }
  }

  return <section className="section retailPricingControls">
    <div className="sectionHead">
      <div><div className="eyebrow">Retail pricing</div><h2>Automatic when known. Manual when needed.</h2><p className="small">Cedriva reuses current, source-linked retail evidence only for the exact brand, line, vitola, and release. It never replaces an existing collector-entered retail price during autofill.</p></div>
      <button className="button" type="button" disabled={mode === "mock" || busy !== "" || (mode === "smartsheet" && !writeKey)} onClick={autofill}>{busy === "autofill" ? "Applying…" : "Apply known retail prices"}</button>
    </div>
    <form className="recordForm" onSubmit={saveManual}>
      <label><span>Cigar</span><select value={inventoryId} onChange={event => { const item = items.find(value => value.inventoryId === event.target.value); setInventoryId(event.target.value); setSticksPerBox(item?.sticksPerBox ? String(item.sticksPerBox) : ""); }} required>{items.map(item => <option value={item.inventoryId} key={item.inventoryId}>{item.brand} · {item.line} · {item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</option>)}</select></label>
      <label><span>Price basis</span><select value={basis} onChange={event => setBasis(event.target.value as "Per cigar" | "Full box")}><option>Per cigar</option><option>Full box</option></select></label>
      <label><span>{basis === "Per cigar" ? "Retail price per cigar" : "Retail price for full box"}</span><input value={price} onChange={event => setPrice(event.target.value)} type="number" min="0" step="0.01" required /></label>
      <label><span>Cigars per box</span><input value={sticksPerBox} onChange={event => setSticksPerBox(event.target.value)} type="number" min="1" step="1" required={basis === "Full box"} placeholder={selected?.sticksPerBox ? String(selected.sticksPerBox) : "Needed for box value"} /></label>
      <label><span>Source</span><input value={source} onChange={event => setSource(event.target.value)} placeholder="Retailer, manufacturer, receipt, or your entry" /></label>
      <label><span>Source link</span><input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} type="url" placeholder="Optional evidence URL" /></label>
      {mode === "smartsheet" && <label><span>Founder write key</span><input value={writeKey} onChange={event => setWriteKey(event.target.value)} type="password" required /></label>}
      <div className="manualPricePreview"><span>Per cigar</span><strong>{money(normalized?.unitPrice)}</strong><span>Per full box</span><strong>{money(normalized?.boxPrice)}</strong></div>
      <button className="button secondary" disabled={mode === "mock" || busy !== ""}>{busy === "manual" ? "Saving…" : "Save manual retail price"}</button>
    </form>
    {message && <output className="wideMessage">{message}</output>}
  </section>;
}
