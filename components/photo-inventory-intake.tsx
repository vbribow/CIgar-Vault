"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { cigarBrands } from "@/lib/brand-directory";
import { findInventoryDuplicates, photoDraftId } from "@/lib/photo-intake";
import type { CigarVisionResult } from "@/lib/cigar-vision";
import type { CatalogCigar, InventoryItem } from "@/lib/types";

const evidenceTypes = ["Cigar band", "Single cigar", "Sealed box", "Open box", "Box code", "Habanos seal", "Receipt / provenance"];

export function PhotoInventoryIntake({ catalog, inventory, onDraft }: { catalog: CatalogCigar[]; inventory: InventoryItem[]; onDraft: (draft: InventoryItem) => void }) {
  const [photos, setPhotos] = useState<Array<{ name: string; url: string; file: File }>>([]);
  const [brand, setBrand] = useState("");
  const [line, setLine] = useState("");
  const [vitola, setVitola] = useState("");
  const [vintage, setVintage] = useState("");
  const [message, setMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CigarVisionResult | null>(null);
  const brands = useMemo(() => [...new Set([...cigarBrands.map((item) => item.name), ...catalog.map((item) => item.brand)])].sort(), [catalog]);
  const lines = useMemo(() => [...new Set(catalog.filter((item) => !brand || item.brand.toLowerCase() === brand.toLowerCase()).map((item) => item.line))].sort(), [brand, catalog]);
  const vitolas = useMemo(() => [...new Set(catalog.filter((item) => (!brand || item.brand.toLowerCase() === brand.toLowerCase()) && (!line || item.line.toLowerCase() === line.toLowerCase())).map((item) => item.vitola))].sort(), [brand, line, catalog]);
  const duplicates = useMemo(() => findInventoryDuplicates({ brand, line, vitola, vintage }, inventory), [brand, inventory, line, vintage, vitola]);

  useEffect(() => () => { photos.forEach((photo) => URL.revokeObjectURL(photo.url)); }, [photos]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    setMessage("");
    if (!files.length) return;
    if (files.length > 8) { setMessage("Choose up to 8 photos for one physical box or loose-cigar lot."); return; }
    if (files.some((file) => file.size > 12 * 1024 * 1024)) { setMessage("Each photo must be 12 MB or smaller."); return; }
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.url));
      return files.map((file) => ({ name: file.name, url: URL.createObjectURL(file), file }));
    });
    setAnalysis(null);
  }

  async function preparedPhoto(file: File) {
    const image = document.createElement("img");
    const source = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`Could not read ${file.name}`)); image.src = source; });
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Photo preparation failed")), "image/jpeg", .76));
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
    } finally { URL.revokeObjectURL(source); }
  }

  async function analyzePhotos() {
    setAnalyzing(true); setMessage("");
    try {
      const form = new FormData();
      for (const photo of photos) form.append("photos", await preparedPhoto(photo.file));
      const writeKey = document.querySelector<HTMLInputElement>("input[name='writeKey']")?.value || "";
      const response = await fetch("/api/photo-identification", { method: "POST", headers: writeKey ? { "x-founder-key": writeKey } : undefined, body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Photo analysis failed");
      const identified = result.data as CigarVisionResult;
      setAnalysis(identified); setBrand(identified.brand); setLine(identified.line); setVitola(identified.vitola); setVintage(identified.vintage || "");
      setMessage(`Identification ready (${identified.confidence} confidence). Review every field before creating the draft.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Photo analysis failed"); }
    finally { setAnalyzing(false); }
  }

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullBoxQty = Number(data.get("fullBoxQty") || 0);
    const sticksPerBox = Number(data.get("sticksPerBox") || 0);
    const looseStickQty = Number(data.get("looseStickQty") || 0);
    const draft: InventoryItem = {
      inventoryId: photoDraftId(), brand: brand.trim(), line: line.trim(), vitola: vitola.trim(), vintage: vintage.trim() || undefined,
      fullBoxQty: fullBoxQty || undefined, sticksPerBox: sticksPerBox || undefined, looseStickQty: looseStickQty || undefined,
      packaging: String(data.get("packaging") || "").trim() || analysis?.packaging || undefined, boxCode: analysis?.boxCode || undefined, smokedQty: 0, status: "Hold", priority: "Medium",
      notes: `Photo-assisted intake (${data.get("evidenceType")}): ${photos.map((photo) => photo.name).join(", ")}. ${analysis ? `Vision ${analysis.confidence}: ${analysis.evidenceSummary}${analysis.uncertainties.length ? ` Uncertain: ${analysis.uncertainties.join("; ")}.` : ""}` : "Identification entered manually."} ${duplicates.length ? `${duplicates.length} possible duplicate${duplicates.length === 1 ? "" : "s"} reviewed before save.` : "No likely duplicate found."}`,
    };
    onDraft(draft); setMessage("Draft created below. Review every field before saving.");
    document.querySelector(".editor")?.scrollIntoView({ behavior: "smooth" });
  }

  return <section className="photoIntake card"><div><div className="eyebrow">Photo-assisted inventory</div><h2>Photograph one physical asset.</h2><p>Add up to eight views of the same box, presentation, or loose-cigar lot. Analyze them, review the identification and duplicate warning, then create an editable draft. Nothing saves until you click Add lot.</p></div><div className="photoIntakeLayout"><div><label className="photoDrop"><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={chooseFile}/>{photos.length?<div className="photoPreviewGrid">{photos.map((photo)=><img key={photo.url} src={photo.url} alt={photo.name}/>)}</div>:<span><b>Take or choose photos</b><small>Box front, interior, bands, seal, and box code</small></span>}</label><button type="button" className="button analyzePhotos" disabled={!photos.length||analyzing} onClick={analyzePhotos}>{analyzing?"Analyzing photos…":"Identify from photos"}</button></div><form onSubmit={createDraft}><label><span>Evidence type</span><select name="evidenceType">{evidenceTypes.map((value)=><option key={value}>{value}</option>)}</select></label><label><span>Likely brand *</span><input name="brand" value={brand} onChange={(event)=>{setBrand(event.target.value);setLine("")}} list="photo-brand-options" required placeholder="Search brand"/><datalist id="photo-brand-options">{brands.map((value)=><option key={value} value={value}/>)}</datalist></label><label><span>Likely line</span><input name="line" value={line} onChange={(event)=>setLine(event.target.value)} list="photo-line-options" placeholder="Choose or type"/><datalist id="photo-line-options">{lines.map((value)=><option key={value} value={value}/>)}</datalist></label><label><span>Likely vitola *</span><input name="vitola" value={vitola} onChange={(event)=>setVitola(event.target.value)} list="photo-vitola-options" required placeholder="Choose or type"/><datalist id="photo-vitola-options">{vitolas.map((value)=><option key={value} value={value}/>)}</datalist></label><label><span>Release / vintage year</span><input name="vintage" value={vintage} onChange={(event)=>setVintage(event.target.value)} inputMode="numeric" placeholder="Example: 2023"/></label><label><span>Packaging</span><input name="packaging" defaultValue={analysis?.packaging || ""} key={analysis?.packaging || "packaging"} placeholder="Presentation box, chest, tin…"/></label><label><span>Full boxes</span><input name="fullBoxQty" type="number" min="0" step="1" defaultValue={analysis?.fullBoxQty ?? undefined} key={`boxes-${analysis?.fullBoxQty}`} placeholder="0"/></label><label><span>Cigars per box</span><input name="sticksPerBox" type="number" min="1" step="1" defaultValue={analysis?.sticksPerBox ?? undefined} key={`per-${analysis?.sticksPerBox}`} placeholder="10, 20, 25…"/></label><label><span>Loose sticks</span><input name="looseStickQty" type="number" min="0" step="1" defaultValue={analysis?.looseStickQty ?? undefined} key={`loose-${analysis?.looseStickQty}`} placeholder="0"/></label>{analysis&&<div className={`visionEvidence confidence-${analysis.confidence}`}><strong>{analysis.confidence} confidence</strong><p>{analysis.evidenceSummary}</p>{analysis.uncertainties.length>0&&<small>Check: {analysis.uncertainties.join(" · ")}</small>}</div>}{duplicates.length>0&&<div className="duplicateReview"><strong>Possible existing inventory</strong>{duplicates.map(({item,score,reasons})=><a href={`/inventory/${encodeURIComponent(item.inventoryId)}`} target="_blank" key={item.inventoryId}><span>{item.brand} · {item.line} · {item.vitola}</span><small>{score}% match · {reasons.join(", ")} · {item.currentQty ?? "unknown"} owned</small></a>)}<p>Only continue if this is a separate physical box or lot.</p></div>}<button className="button" disabled={!photos.length}>Create review draft</button>{message&&<output>{message}</output>}</form></div><div className="photoAiStatus"><span>Visual identification</span><strong>{analysis ? `${analysis.confidence} confidence draft` : duplicates.length ? "Possible duplicate found" : "Ready to analyze"}</strong><small>Photos are resized in your browser and sent securely to the server. Identification never saves inventory without your review.</small></div></section>;
}
