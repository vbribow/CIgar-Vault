"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { DataMode } from "@/lib/config";
import type { CigarVisionResult } from "@/lib/cigar-vision";
import { applyCorrectionSuggestions, correctionSuggestions, type CorrectionField } from "@/lib/inventory-correction";
import { findInventoryDuplicates } from "@/lib/photo-intake";
import type { InventoryItem } from "@/lib/types";

async function prepare(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  const image = document.createElement("img"), url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`Could not read ${file.name}. Try a JPG photo.`)); image.src = url; });
    const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("This browser could not prepare the photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("This browser could not prepare the photo.")), "image/jpeg", .72));
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}

export function InventoryCorrectionAssistant({ item, inventory, mode, onApplied }: { item: InventoryItem; inventory: InventoryItem[]; mode: DataMode; onApplied: (item: InventoryItem) => void }) {
  const [files, setFiles] = useState<File[]>([]), [result, setResult] = useState<CigarVisionResult>(), [approved, setApproved] = useState<Set<CorrectionField>>(new Set()), [busy, setBusy] = useState(false), [saving, setSaving] = useState(false), [message, setMessage] = useState("");
  const suggestions = useMemo(() => result ? correctionSuggestions(item, result) : [], [item, result]);
  const duplicates = useMemo(() => result ? findInventoryDuplicates({ brand: result.brand, line: result.line, vitola: result.vitola, vintage: result.vintage || undefined }, inventory.filter(candidate => candidate.inventoryId !== item.inventoryId)) : [], [inventory, item.inventoryId, result]);
  function choose(event: ChangeEvent<HTMLInputElement>) { const chosen = [...(event.target.files || [])].slice(0, 8); setFiles(chosen); setResult(undefined); setApproved(new Set()); setMessage(chosen.length ? `${chosen.length} photo${chosen.length === 1 ? "" : "s"} ready for comparison.` : ""); }
  async function analyze() { if (!files.length) return; setBusy(true); setMessage(""); try { const form = new FormData(); for (const file of files) form.append("photos", await prepare(file)); const response = await fetch("/api/photo-identification", { method: "POST", body: form }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Analysis failed"); const value = payload.data as CigarVisionResult; const changes = correctionSuggestions(item, value); setResult(value); setApproved(new Set(changes.map(change => change.field))); setMessage(changes.length ? `${changes.length} proposed correction${changes.length === 1 ? "" : "s"}. Review each one.` : "The photos agree with the current record; no corrections were found."); } catch (error) { setMessage(error instanceof Error ? error.message : "Analysis failed"); } finally { setBusy(false); } }
  async function apply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!result || !approved.size || !window.confirm(`Apply ${approved.size} selected correction${approved.size === 1 ? "" : "s"} to ${item.inventoryId}?`)) return; const form = new FormData(event.currentTarget), updated = applyCorrectionSuggestions(item, result, [...approved]); setSaving(true); setMessage(""); try { const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-founder-key": String(form.get("writeKey") || "") }, body: JSON.stringify(updated) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Correction failed"); onApplied(payload.data); setResult(undefined); setFiles([]); setApproved(new Set()); setMessage("Selected corrections saved and synchronized ✓"); } catch (error) { setMessage(error instanceof Error ? error.message : "Correction failed"); } finally { setSaving(false); } }
  return <section className="section card correctionAssistant"><div className="sectionHead"><div><div className="eyebrow">AI record correction</div><h3>Analyze and correct this record</h3><p className="small">Photograph the cigar, band, box, code, or contents. AI proposes changes; you approve each field before anything saves.</p></div></div>
    <div className="correctionCapture"><label><span>Choose or take up to 8 photos</span><input type="file" accept="image/*" capture="environment" multiple onChange={choose}/></label><button type="button" className="button secondary" disabled={!files.length || busy} onClick={analyze}>{busy ? "Comparing photos…" : "Analyze against record"}</button></div>
    {result&&<><div className={`visionEvidence confidence-${result.confidence}`}><strong>{result.confidence} confidence</strong><p>{result.evidenceSummary}</p>{result.uncertainties.length>0&&<small>Check carefully: {result.uncertainties.join(" · ")}</small>}</div>{duplicates.length>0&&<div className="duplicateReview"><strong>Possible duplicate lot{duplicates.length===1?"":"s"}</strong>{duplicates.map(candidate=><a href={`/inventory/${encodeURIComponent(candidate.item.inventoryId)}`} target="_blank" key={candidate.item.inventoryId}>{candidate.item.brand} · {candidate.item.line} · {candidate.item.vitola} ({candidate.score}%)</a>)}</div>}<form onSubmit={apply}><div className="tableWrap"><table className="table"><thead><tr><th>Apply</th><th>Field</th><th>Current</th><th>AI suggestion</th></tr></thead><tbody>{suggestions.map(change=><tr key={change.field}><td><input type="checkbox" aria-label={`Apply ${change.label}`} checked={approved.has(change.field)} onChange={event=>setApproved(current=>{const next=new Set(current);event.target.checked?next.add(change.field):next.delete(change.field);return next})}/></td><td><strong>{change.label}</strong></td><td>{String(change.current??"Not recorded")}</td><td>{String(change.suggested)}</td></tr>)}</tbody></table></div>{mode==="smartsheet"&&<label><span>Founder write key *</span><input name="writeKey" type="password" required/></label>}<button className="button" disabled={!approved.size||saving}>{saving?"Saving corrections…":`Approve ${approved.size} selected change${approved.size===1?"":"s"}`}</button></form></>}
    {message&&<output aria-live="polite">{message}</output>}
  </section>;
}
