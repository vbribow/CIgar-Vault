"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataMode } from "@/lib/config";

export function CollectionPopulateButton({ collectionId, mode, correctionCount = 0 }: { collectionId: string; mode: DataMode; correctionCount?: number }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();
  async function populate() {
    if (!window.confirm(
      correctionCount
        ? `Repair ${correctionCount} legacy collection assignment${correctionCount === 1 ? "" : "s"} and complete the exact physical lots? Cedriva will preserve collector quantities, photos, notes, and independent inventory records. Nothing will be deleted.`
        : "Confirm that you own this complete presentation. Cedriva will add its documented cigar components to main inventory and link them to this collection.",
    )) return;
    const founderKey = mode === "smartsheet" ? window.prompt("Founder write key") : "";
    if (mode === "smartsheet" && founderKey === null) return;
    setBusy(true); setMessage("");
    try { const response = await fetch(`/api/collections/${encodeURIComponent(collectionId)}/populate`, { method: "POST", headers: { "x-founder-key": founderKey || "" } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Population failed"); const unresolved = payload.data.unresolved?.length || 0, linked = payload.data.linked || 0, repaired = payload.data.repaired || 0; setMessage(`${payload.data.created} inventory lot${payload.data.created === 1 ? "" : "s"} created${linked ? ` · ${linked} existing lot${linked === 1 ? "" : "s"} linked` : ""}${repaired ? ` · ${repaired} legacy component${repaired === 1 ? "" : "s"} upgraded` : ""}.${unresolved ? ` ${unresolved} item${unresolved === 1 ? "" : "s"} still require exact research.` : " Collection contents are now represented."}`); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Population failed"); }
    finally { setBusy(false); }
  }
  const label = correctionCount
    ? `Repair ${correctionCount} assignment${correctionCount === 1 ? "" : "s"} & complete exact lots`
    : "I own the complete set — populate inventory";
  return <div className="populateCollection"><button type="button" className="button" disabled={busy || mode === "mock"} onClick={populate}>{busy ? "Reconciling exact inventory…" : label}</button>{correctionCount>0&&<small>Collector quantities and independent lots are preserved. No inventory is deleted.</small>}{message&&<output aria-live="polite">{message}</output>}</div>;
}
