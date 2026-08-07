"use client";

import { FormEvent, useRef, useState } from "react";
import type { WishlistItem } from "@/lib/types";
import { OFAC_CUBAN_GOODS_URL } from "@/lib/habanos-protection";
import { recentYearOptions } from "@/lib/year-options";
import { readSaveResponse, saveRecoveryMessage } from "@/lib/save-recovery";
import { useDeviceFormDraft } from "@/components/use-device-form-draft";
import { useUnsavedChanges } from "@/components/use-unsaved-changes";

const today = () => new Date().toISOString().slice(0, 10);

export function WishlistPurchaseIntake({ items }: { items: WishlistItem[] }) {
  const [pending, setPending] = useState(items.filter((item) => item.status === "Purchased" && !item.inventoryId));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string>();
  const [lastSaved, setLastSaved] = useState<{ item: WishlistItem; inventoryId: string }>();
  const conversionInFlight = useRef(false);
  const purchaseSafety = useUnsavedChanges();

  async function convert(form: HTMLFormElement, item: WishlistItem) {
    if (conversionInFlight.current) return false;
    conversionInFlight.current = true; setSaving(item.wishlistId); setMessage("");
    const data = new FormData(form);
    const body = { wishlistId: item.wishlistId, quantity: Number(data.get("quantity")), packaging: String(data.get("packaging") || "") || undefined, vintage: String(data.get("vintage") || "") || undefined, totalCost: data.get("totalCost") ? Number(data.get("totalCost")) : undefined, storageLocationId: String(data.get("storageLocationId") || "") || undefined, purchaseDate: String(data.get("purchaseDate")), acquisitionSeller: String(data.get("acquisitionSeller") || "") || undefined, acquisitionSourceUrl: String(data.get("acquisitionSourceUrl") || "") || undefined, acquisitionReceiptLink: String(data.get("acquisitionReceiptLink") || "") || undefined, purchaseJurisdiction: String(data.get("purchaseJurisdiction") || "") || undefined, notes: String(data.get("notes") || "") || undefined };
    try {
      const response = await fetch("/api/wishlist/convert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await readSaveResponse(response); if (!response.ok) throw new Error(result.error || "Could not add purchase");
      setPending((current) => current.filter((value) => value.wishlistId !== item.wishlistId)); setLastSaved({ item, inventoryId: result.data.inventory.inventoryId });
      setMessage(`${item.brand} ${item.vitola} was added to your private Vault.`); purchaseSafety.markSaved(); return true;
    } catch (error) { setMessage(saveRecoveryMessage(error, "this purchased cigar")); return false; }
    finally { conversionInFlight.current = false; setSaving(undefined); }
  }

  return <section className="purchaseIntake"><div className="sectionHead"><div><div className="eyebrow">Purchase handoff</div><h2>Add purchased cigars to the Vault</h2><p>Confirm the physical quantity and preserve who sold it, where the transaction occurred, and the original evidence.</p></div></div>
    <p className="legalCaution">For Cuban-origin tobacco, authenticity and legality are separate. U.S. persons should review <a href={OFAC_CUBAN_GOODS_URL} target="_blank" rel="noreferrer">current Treasury guidance ↗</a> before purchasing, transporting, or importing.</p>
    {message && <output className="wishlistMessage" aria-live="polite">{message}</output>}
    {lastSaved && <div className="mutationCompletion" aria-live="polite"><strong>Purchase documented.</strong><p>{lastSaved.item.brand} {lastSaved.item.line} is now part of your private collection record.</p><div><a className="button" href={`/inventory/${encodeURIComponent(lastSaved.inventoryId)}`}>Open saved record</a>{pending.length > 0 && <button type="button" className="button secondary" onClick={() => { setLastSaved(undefined); setMessage(""); document.querySelector<HTMLFormElement>(".purchaseForms form")?.querySelector<HTMLElement>("input,select")?.focus(); }}>Document another purchase</button>}<a className="button secondary" href="/inventory">Return to Vault</a></div></div>}
    <div className="purchaseForms">{pending.map((item) => <PurchaseForm item={item} saving={saving === item.wishlistId} disabled={Boolean(saving)} onDirty={() => { purchaseSafety.markDirty(); setLastSaved(undefined); }} onConvert={convert} key={item.wishlistId}/>)}{!pending.length && !lastSaved && <div className="emptyState">No purchased wishlist items are waiting for inventory entry.</div>}</div>
  </section>;
}

function PurchaseForm({ item, saving, disabled, onDirty, onConvert }: { item: WishlistItem; saving: boolean; disabled: boolean; onDirty: () => void; onConvert: (form: HTMLFormElement, item: WishlistItem) => Promise<boolean> }) {
  const draft = useDeviceFormDraft(`hojavia:form-draft:wishlist-purchase:${item.wishlistId}:v1`);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await onConvert(event.currentTarget, item)) draft.clear(); }
  function capture(event: FormEvent<HTMLFormElement>) { onDirty(); draft.capture(event); }
  return <form ref={draft.formRef} onSubmit={submit} onChange={capture} aria-busy={saving}><header><div><small>{item.brand} · {item.line}</small><h3>{item.vitola}</h3></div><span>Purchased</span></header>{draft.restoredFields && <p className="deviceDraftNotice" role="status">Unfinished purchase details were restored from this browser profile. Review them before saving.</p>}<div className="purchaseFields">
    <label><span>Quantity *</span><input name="quantity" type="number" min="1" required/></label>
    <label><span>Packaging</span><input name="packaging" placeholder="Box, presentation, loose sticks"/></label>
    <label><span>Vintage / release year</span><select name="vintage"><option value="">Choose the documented year</option>{recentYearOptions().map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
    <label><span>Total purchase cost</span><input name="totalCost" type="number" min="0" step=".01"/></label>
    <label><span>Purchase date *</span><input name="purchaseDate" type="date" required defaultValue={today()}/></label>
    <label><span>Seller</span><input name="acquisitionSeller" placeholder="Legal name or marketplace identity"/></label>
    <label><span>Purchase jurisdiction</span><input name="purchaseJurisdiction" placeholder="Country / state / route"/></label>
    <label><span>Listing or source URL</span><input name="acquisitionSourceUrl" type="url" defaultValue={item.sourceUrl}/></label>
    <label><span>Receipt evidence URL</span><input name="acquisitionReceiptLink" type="url" placeholder="Private evidence link"/></label>
    <label><span>Storage location</span><input name="storageLocationId" placeholder="Humidor ID"/></label>
    <label className="wide"><span>Purchase notes</span><input name="notes"/></label>
  </div><button className="button" disabled={disabled}>{saving ? "Adding to Vault…" : "Confirm and add to Vault"}</button></form>;
}
