"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataMode } from "@/lib/config";

export function CollectionPopulateButton({ collectionId, mode }: { collectionId: string; mode: DataMode }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();
  async function populate() {
    if (!window.confirm("Confirm that you own this complete presentation. Cigar Vault will add its documented cigar components to main inventory and link them to this collection.")) return;
    const founderKey = mode === "smartsheet" ? window.prompt("Founder write key") : "";
    if (mode === "smartsheet" && founderKey === null) return;
    setBusy(true); setMessage("");
    try { const response = await fetch(`/api/collections/${encodeURIComponent(collectionId)}/populate`, { method: "POST", headers: { "x-founder-key": founderKey || "" } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Population failed"); const unresolved = payload.data.unresolved?.length || 0, linked = payload.data.linked || 0; setMessage(`${payload.data.created} inventory lot${payload.data.created === 1 ? "" : "s"} created${linked ? ` and ${linked} existing lot${linked === 1 ? "" : "s"} linked` : ""}.${unresolved ? ` ${unresolved} item${unresolved === 1 ? "" : "s"} still require exact research.` : " Collection contents are now represented."}`); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Population failed"); }
    finally { setBusy(false); }
  }
  return <div className="populateCollection"><button type="button" className="button" disabled={busy || mode === "mock"} onClick={populate}>{busy ? "Populating inventory…" : "I own the complete set — populate inventory"}</button>{message&&<output aria-live="polite">{message}</output>}</div>;
}
