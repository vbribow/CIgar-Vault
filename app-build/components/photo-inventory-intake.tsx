"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { cigarBrands } from "@/lib/brand-directory";
import { findInventoryDuplicates, photoDraftId } from "@/lib/photo-intake";
import { photoPreparationError, validatePhotoSelection } from "@/lib/photo-capture";
import type { CigarVisionResult } from "@/lib/cigar-vision";
import type { DataMode } from "@/lib/config";
import type { CatalogCigar, InventoryItem } from "@/lib/types";
import { VitolaField } from "@/components/vitola-field";
import { recentYearOptions } from "@/lib/year-options";
import searchStyles from "./photo-identification-progress.module.css";
import { fetchWithTimeout, RequestTimeoutError } from "@/lib/request-control";
import { catalogLinesForBrand, catalogVitolasForCigar } from "@/lib/catalog-intake-options";

const evidenceTypes = ["Typed description", "Cigar band", "Single cigar", "Sealed box", "Open box", "Box code", "Habanos seal", "Receipt / provenance"];
const queueKey = "cigar-vault:intake-drafts:v1";
const workingKey = "hojavia:intake-working:v1";

type QueuedDraft = { draft: InventoryItem; photoNames: string[]; confidence: CigarVisionResult["confidence"] | "manual"; duplicateCount: number; uncertaintyCount: number; acknowledged: boolean; selected: boolean };
type IntakePhotoKind = "cigar" | "box" | "habanos-seal" | "box-code" | "provenance";
type IntakeStage = "identify" | "review" | "saved";
type WorkingDraft = { query: string; brand: string; line: string; vitola: string; vintage: string; evidenceType: string; packaging: string; fullBoxQty: string; sticksPerBox: string; looseStickQty: string; stage: "identify" | "review" };

function normalizedSearchTerms(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((term) => term.length > 1);
}

function intakePhotoKind(evidenceType: string): IntakePhotoKind {
  if (evidenceType === "Sealed box" || evidenceType === "Open box") return "box";
  if (evidenceType === "Box code") return "box-code";
  if (evidenceType === "Habanos seal") return "habanos-seal";
  if (evidenceType === "Receipt / provenance") return "provenance";
  return "cigar";
}

export function PhotoInventoryIntake({ catalog, inventory, mode, onDraft, onApproved,initialQuery="",startFresh=false }: { catalog: CatalogCigar[]; inventory: InventoryItem[]; mode: DataMode; onDraft: (draft: InventoryItem) => void; onApproved: (items: InventoryItem[]) => void;initialQuery?:string;startFresh?:boolean }) {
  const [photos, setPhotos] = useState<Array<{ name: string; url: string; file: File }>>([]);
  const [brand, setBrand] = useState("");
  const [line, setLine] = useState("");
  const [vitola, setVitola] = useState("");
  const [vintage, setVintage] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [vaultMatches, setVaultMatches] = useState<InventoryItem[]>([]);
  const [vaultChecked, setVaultChecked] = useState(false);
  const [evidenceType, setEvidenceType] = useState(evidenceTypes[0]);
  const [packaging, setPackaging] = useState("");
  const [fullBoxQty, setFullBoxQty] = useState("");
  const [sticksPerBox, setSticksPerBox] = useState("");
  const [looseStickQty, setLooseStickQty] = useState("");
  const [stage, setStage] = useState<IntakeStage>("identify");
  const [workingReady, setWorkingReady] = useState(false);
  const [message, setMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisKind, setAnalysisKind] = useState<"photos" | "text" | null>(null);
  const [searchPhotoIndex, setSearchPhotoIndex] = useState(0);
  const [analysis, setAnalysis] = useState<CigarVisionResult | null>(null);
  const [queue, setQueue] = useState<QueuedDraft[]>([]);
  const [captureSession, setCaptureSession] = useState(0);
  const [approving, setApproving] = useState(false);
  const [readyForAnother, setReadyForAnother] = useState(false);
  const [photoFailures, setPhotoFailures] = useState<Array<{ inventoryId: string; reason: string }>>([]);
  const draftPhotos=useRef(new Map<string, { file: File; kind: IntakePhotoKind }>());
  const photosRef = useRef(photos);
  const approvalInFlight = useRef(false);
  const identificationRequest = useRef(0);
  const identificationInput = useRef<HTMLInputElement>(null);
  const completion = useRef<HTMLElement>(null);
  const messageOutput = useRef<HTMLOutputElement>(null);
  const brands = useMemo(() => [...new Set([...cigarBrands.map((item) => item.name), ...catalog.map((item) => item.brand)])].sort(), [catalog]);
  const lines = useMemo(() => brand ? catalogLinesForBrand(catalog,brand) : [...new Set(catalog.map(item=>item.line).filter(Boolean))].sort(), [brand, catalog]);
  const vitolas = useMemo(() => brand&&line ? catalogVitolasForCigar(catalog,brand,line) : [], [brand, line, catalog]);
  const duplicates = useMemo(() => findInventoryDuplicates({ brand, line, vitola, vintage }, inventory), [brand, inventory, line, vintage, vitola]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(queueKey) || "[]");
      if (Array.isArray(saved)) {
        setQueue(saved);
        if (saved.some((entry: QueuedDraft) => entry.photoNames?.length)) setMessage("Draft details were restored. For privacy and browser security, select the original photos again before approval if you want them attached.");
      }
    } catch { /* ignore damaged local draft cache */ }
  }, []);
  useEffect(() => { localStorage.setItem(queueKey,JSON.stringify(queue)); }, [queue]);

  useEffect(() => {
    try {
      if(startFresh){localStorage.removeItem(workingKey);setWorkingReady(true);window.setTimeout(()=>identificationInput.current?.focus(),0);return}
      const saved = JSON.parse(localStorage.getItem(workingKey) || "null") as WorkingDraft | null;
      if (saved) {
        setQuery(saved.query || ""); setBrand(saved.brand || ""); setLine(saved.line || ""); setVitola(saved.vitola || ""); setVintage(saved.vintage || "");
        setEvidenceType(saved.evidenceType || evidenceTypes[0]); setPackaging(saved.packaging || ""); setFullBoxQty(saved.fullBoxQty || ""); setSticksPerBox(saved.sticksPerBox || ""); setLooseStickQty(saved.looseStickQty || "");
        setStage(saved.stage === "review" ? "review" : "identify");
        setMessage("Your unfinished typed details were restored on this device. Photos are never stored in the browser and must be selected again.");
      }
    } catch { /* ignore damaged working draft */ }
    setWorkingReady(true);
  }, [startFresh]);
  useEffect(() => {
    if (!workingReady || stage === "saved") return;
    const working: WorkingDraft = { query, brand, line, vitola, vintage, evidenceType, packaging, fullBoxQty, sticksPerBox, looseStickQty, stage };
    if (Object.values(working).some((value) => value && value !== "identify" && value !== evidenceTypes[0])) localStorage.setItem(workingKey, JSON.stringify(working));
    else localStorage.removeItem(workingKey);
  }, [brand, evidenceType, fullBoxQty, line, looseStickQty, packaging, query, stage, sticksPerBox, vintage, vitola, workingReady]);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => { photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)); }, []);
  useEffect(() => {
    if (!analyzing || analysisKind !== "photos" || photos.length < 2) { setSearchPhotoIndex(0); return; }
    const timer = window.setInterval(() => setSearchPhotoIndex((current) => (current + 1) % photos.length), 1200);
    return () => window.clearInterval(timer);
  }, [analysisKind, analyzing, photos.length]);

  function applyIdentification(value: CigarVisionResult) {
    setAnalysis(value); setBrand(value.brand); setLine(value.line); setVitola(value.vitola); setVintage(value.vintage || ""); setPackaging(value.packaging || "");
    setFullBoxQty(value.fullBoxQty == null ? "" : String(value.fullBoxQty)); setSticksPerBox(value.sticksPerBox == null ? "" : String(value.sticksPerBox)); setLooseStickQty(value.looseStickQty == null ? "" : String(value.looseStickQty));
    setStage("review"); setMessage(`Identification ready (${value.confidence} confidence). Review every field before adding the draft.`);
  }
  function checkVault() {
    const terms = normalizedSearchTerms(query);
    const matches = inventory.filter((item) => {
      const searchable = normalizedSearchTerms([item.brand, item.line, item.vitola, item.vintage].filter(Boolean).join(" "));
      return terms.every((term) => searchable.some((value) => value.includes(term) || term.includes(value)));
    }).slice(0, 8);
    setVaultMatches(matches);
    setVaultChecked(true);
    setMessage(matches.length
      ? `${matches.length} possible existing Vault record${matches.length === 1 ? "" : "s"} found. Review before adding a separate lot.`
      : "No existing Vault record matched this wording. You can research the cigar or enter its details manually.");
  }
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])]; setMessage(""); const error = validatePhotoSelection(photos.map((photo) => photo.file), files); event.target.value = "";
    if (error) { setMessage(error); return; }
    setPhotos((current) => [...current, ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file), file }))]); setAnalysis(null); setMessage(`${files.length} photo${files.length === 1 ? "" : "s"} ready. Add another view or identify now.`);
  }
  async function preparedPhoto(file: File) {
    const image = document.createElement("img"), source = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(photoPreparationError(file.name))); image.src = source; });
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight)), canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d"); if (!context) throw new Error(photoPreparationError(file.name)); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error(photoPreparationError(file.name))), "image/jpeg", .72));
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
    } catch { throw new Error(photoPreparationError(file.name)); } finally { URL.revokeObjectURL(source); }
  }
  async function identify(kind: "photos" | "text") {
    const requestId = ++identificationRequest.current;
    setAnalysisKind(kind); setAnalyzing(true); setMessage("");
    try {
      let response: Response;
      if (kind === "text") response = await fetchWithTimeout("/api/photo-identification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) }, 25_000);
      else { const form = new FormData(); for (const photo of photos) form.append("photos", await preparedPhoto(photo.file)); response = await fetchWithTimeout("/api/photo-identification", { method: "POST", body: form }, 25_000); }
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Identification failed"); if (requestId === identificationRequest.current) applyIdentification(result.data);
    } catch (error) { if (requestId === identificationRequest.current) setMessage(error instanceof RequestTimeoutError ? "Identification is taking longer than expected. Your photos are still selected—try again when you’re ready." : error instanceof Error ? error.message : "Identification failed"); } finally { if (requestId === identificationRequest.current) { setAnalyzing(false); setAnalysisKind(null); } }
  }
  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const showError = (value: string) => { setMessage(value); window.setTimeout(() => { messageOutput.current?.scrollIntoView({ behavior: "smooth", block: "center" }); messageOutput.current?.focus(); }, 0); };
    const fullBoxRaw=fullBoxQty.trim(),sticksPerBoxRaw=sticksPerBox.trim(),looseStickRaw=looseStickQty.trim();
    const fullBoxes = fullBoxRaw===""?undefined:Number(fullBoxRaw), sticks = sticksPerBoxRaw === "" ? undefined : Number(sticksPerBoxRaw), loose = looseStickRaw === "" ? undefined : Number(looseStickRaw), photoNames = photos.map((photo) => photo.name);
    if (!brand.trim() || !line.trim() || !vitola.trim()) { showError("Add the brand, cigar line, and exact vitola before continuing to final review."); return; }
    if ([fullBoxes, sticks, loose].some((value) => value !== undefined && (!Number.isInteger(value) || value < 0)) || sticks === 0) { setMessage("Quantities must be whole numbers. Boxes and loose sticks may be 0; cigars per box must be greater than 0."); return; }
    if ((fullBoxes ?? 0) > 0 && !sticks) { setMessage("Enter cigars per box when the lot includes a full box."); return; }
    const draft: InventoryItem = { inventoryId: photoDraftId(), brand: brand.trim(), line: line.trim(), vitola: vitola.trim(), vintage: vintage.trim() || undefined, fullBoxQty: fullBoxes, sticksPerBox: sticks, looseStickQty: loose, packaging: packaging.trim() || analysis?.packaging || undefined, boxCode: analysis?.boxCode || undefined, smokedQty: 0, status: "Hold", priority: "Medium", provenanceNotes: `Intake evidence: ${photoNames.length ? photoNames.join(", ") : query || "manual description"}.`, notes: `Assisted intake (${evidenceType}): ${analysis ? `AI ${analysis.confidence}: ${analysis.evidenceSummary}${analysis.uncertainties.length ? ` Uncertain: ${analysis.uncertainties.join("; ")}.` : ""}` : "Identification entered manually."} ${duplicates.length ? `${duplicates.length} possible duplicate(s) require acknowledgement.` : "No likely duplicate found."}` };
    if (photos[0]) draftPhotos.current.set(draft.inventoryId, { file: photos[0].file, kind: intakePhotoKind(evidenceType) });
    const entry: QueuedDraft = { draft, photoNames, confidence: analysis?.confidence || "manual", duplicateCount: duplicates.length, uncertaintyCount: analysis?.uncertainties.length || 0, acknowledged: duplicates.length === 0, selected: true };
    setQueue((current) => [...current, entry]); onDraft(draft); setReadyForAnother(true); setStage("saved"); localStorage.removeItem(workingKey);
    setMessage(`Draft saved locally and opened for review.${photos.length ? " Its primary photo will attach automatically when approved." : ""} Inventory has not changed.`);
    window.setTimeout(() => { completion.current?.scrollIntoView({ behavior: "smooth", block: "center" }); completion.current?.focus(); }, 0);
  }
  function nextAsset() {
    setPhotos((current) => { current.forEach((photo) => URL.revokeObjectURL(photo.url)); return []; }); setBrand(""); setLine(""); setVitola(""); setVintage(""); setQuery(""); setVaultMatches([]); setVaultChecked(false); setEvidenceType(evidenceTypes[0]); setPackaging(""); setFullBoxQty(""); setSticksPerBox(""); setLooseStickQty(""); setAnalysis(null); setReadyForAnother(false); setStage("identify"); localStorage.removeItem(workingKey);
    setMessage("Ready to document another cigar."); setCaptureSession((value) => value + 1); document.querySelector(".photoIntake")?.scrollIntoView({ behavior: "smooth" }); window.setTimeout(() => identificationInput.current?.focus(), 350);
  }
  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(approvalInFlight.current)return;
    const selected = queue.filter((entry) => entry.selected), blocked = selected.filter((entry) => entry.duplicateCount && !entry.acknowledged);
    if (!selected.length) { setMessage("Select at least one draft."); return; } if (blocked.length) { setMessage("Acknowledge every possible duplicate before approval."); return; }
    const form = new FormData(event.currentTarget), syncMaster = mode === "smartsheet" && form.get("syncMaster") === "on"; approvalInFlight.current = true; setApproving(true); setMessage(""); setPhotoFailures([]);
    try {
      const response = await fetchWithTimeout("/api/inventory/intake", { method: "POST", headers: { "content-type": "application/json", "x-founder-key": mode === "smartsheet" ? String(form.get("writeKey") || "") : "" }, body: JSON.stringify({ drafts: selected.map((entry) => entry.draft), acknowledgedDuplicateIds: selected.filter((entry) => entry.acknowledged).map((entry) => entry.draft.inventoryId), syncMaster }) }, 20_000);
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Approval failed"); const approvedInventory = [...result.data.inventory] as InventoryItem[]; let attached = 0, photoRetries = 0; const failures: Array<{ inventoryId: string; reason: string }> = [];
      for (let index = 0; index < approvedInventory.length; index++) {
        const item = approvedInventory[index], evidence = draftPhotos.current.get(item.inventoryId), queued = selected.find((entry) => entry.draft.inventoryId === item.inventoryId);
        if (!evidence) { if (queued?.photoNames.length) { photoRetries++; failures.push({ inventoryId: item.inventoryId, reason: "The browser cannot restore the original file after a refresh." }); } continue; }
        const upload = new FormData(); upload.set("kind", evidence.kind); upload.set("file", evidence.file);
        try { const photoResponse = await fetchWithTimeout(`/api/inventory/${encodeURIComponent(item.inventoryId)}/photos`, { method: "POST", body: upload }, 30_000); const photoResult = await photoResponse.json(); if (!photoResponse.ok) throw new Error(photoResult.error||"Photo attachment failed"); approvedInventory[index] = photoResult.data; attached++; }
        catch (error) { photoRetries++; failures.push({ inventoryId: item.inventoryId, reason: error instanceof Error ? error.message : "Photo attachment failed." }); }
      }
      setPhotoFailures(failures); const approved = new Set(selected.map((entry) => entry.draft.inventoryId)); approved.forEach((id) => draftPhotos.current.delete(id)); const remaining=queue.filter(entry=>!approved.has(entry.draft.inventoryId));setQueue(remaining);localStorage.setItem(queueKey,JSON.stringify(remaining));localStorage.removeItem(workingKey);
      if(approvedInventory.length===1){setMessage("");onApproved(approvedInventory);return}
      onApproved(approvedInventory);
      const masterStatus = syncMaster ? ` ${result.data.masterSaved} also saved to the founder’s master list.` : "", photoStatus = attached ? ` ${attached} primary photo${attached === 1 ? "" : "s"} attached.` : "", retryStatus = photoRetries ? ` ${photoRetries} photo${photoRetries === 1 ? "" : "s"} still need to be attached from the saved record.` : "";
      setMessage(`${result.data.approved} cigar record${result.data.approved === 1 ? "" : "s"} added to your Vault.${masterStatus} ${result.data.valuationStatus}.${photoStatus}${retryStatus}`);
    } catch (error) { setMessage(error instanceof RequestTimeoutError ? "Saving is taking longer than expected. Keep this draft open and try again; Hojavía will protect against duplicate approval." : error instanceof Error ? error.message : "Approval failed"); } finally { approvalInFlight.current = false; setApproving(false); }
  }

  const pending = queue.filter((entry) => entry.selected).length;
  return <section className="photoIntake card" id="mobile-intake">
    <header className="intakeHeader"><div className="eyebrow">Add a cigar</div><h2>Start with a photo or what you know.</h2><p>Hojavía can suggest details. You review them before anything is added to your private Vault.</p></header>
    <ol className="intakeProgress" aria-label="Documentation progress">
      {(["identify", "review", "saved"] as IntakeStage[]).map((value, index) => <li key={value} aria-current={stage === value ? "step" : undefined} className={stage === value ? "active" : (["review", "saved"].includes(stage) && index === 0) || (stage === "saved" && index === 1) ? "complete" : ""}><span>{index + 1}</span><strong>{value === "identify" ? "Identify" : value === "review" ? "Review" : "Saved"}</strong></li>)}
    </ol>

    {stage === "identify" && <section className="intakeStage" aria-labelledby="identify-stage-title" aria-busy={analyzing && analysisKind === "photos"}>
      <div><div className="eyebrow">Step 1 of 3</div><h3 id="identify-stage-title">Start with what you know.</h3><p>Type a description or photograph one physical asset. You can always enter details manually.</p></div>
      <div className="textIdentification"><input ref={identificationInput} aria-label="Cigar name to check in my Vault" value={query} onChange={(event) => { setQuery(event.target.value); setVaultChecked(false); setVaultMatches([]); }} onKeyDown={(event) => { if (event.key === "Enter" && query.trim().length >= 3) { event.preventDefault(); checkVault(); } }} placeholder="Type a cigar, e.g. Fuente La Gran Fumada"/><button type="button" className="button" disabled={query.trim().length < 3 || analyzing} onClick={checkVault}>Check my Vault</button></div>
      <small className="intakeSearchHelp">Searches your existing cigar records first. This check uses no research credits.</small>
      {vaultChecked && <section className="intakeSearchResults" aria-live="polite" aria-label="Vault search results">
        {vaultMatches.length > 0 ? <><strong>Possible matches already in your Vault</strong><p>Open a record to confirm whether this is the same physical lot, or edit that exact row directly.</p><div>{vaultMatches.map((item) => <article className="intakeVaultMatch" key={item.inventoryId}><div><span>{item.brand} · {item.line}</span><small>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""} · {item.inventoryId}</small></div><div><a href={`/inventory/${encodeURIComponent(item.inventoryId)}`}>Open record</a><a href={`/inventory?vaultSearch=${encodeURIComponent(item.inventoryId)}&edit=${encodeURIComponent(item.inventoryId)}&focus=all#inventory-editor`}>Edit all details</a></div></article>)}</div><button type="button" className="button secondary" disabled={analyzing} onClick={() => identify("text")}>{analyzing ? "Researching…" : "This is a separate lot — research it"}</button></> : <><strong>No matching Vault record found</strong><p>The wording may differ, so you can research the cigar before creating a new lot.</p><button type="button" className="button secondary" disabled={analyzing} onClick={() => identify("text")}>{analyzing ? "Researching…" : "Research this cigar"}</button><small>Research may use AI credits. Nothing is saved until you review and confirm it.</small></>}
      </section>}
      <div className="photoIdentifyGrid"><div><label className="cameraCapture"><input key={`camera-${captureSession}`} type="file" accept="image/*" capture="environment" onChange={chooseFile}/><span>Open rear camera</span><small>Best for a single band, box, seal, or code</small></label><label className="photoDrop"><input key={captureSession} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseFile}/>{photos.length ? <div className="photoPreviewGrid">{photos.map((photo) => <img key={photo.url} src={photo.url} alt={photo.name}/>)}</div> : <span><b>Choose existing photos</b><small>Up to 8 images of one physical asset</small></span>}</label><button type="button" className="button analyzePhotos" disabled={!photos.length||analyzing} onClick={() => identify("photos")}>{analyzing ? "Analyzing…" : "Identify from photos"}</button></div></div>
      {analyzing && analysisKind === "photos" && photos.length > 0 && <section className={searchStyles.searchStage} aria-live="polite" aria-label="AI photo identification in progress">
        <div className={searchStyles.activePhoto}><img src={photos[Math.min(searchPhotoIndex, photos.length - 1)].url} alt={`Selected cigar evidence ${searchPhotoIndex + 1} of ${photos.length}: ${photos[Math.min(searchPhotoIndex, photos.length - 1)].name}`}/><span aria-hidden="true" /></div>
        <div className={searchStyles.searchDetail}><div className="eyebrow">AI-assisted identification</div><h4>Reviewing your selected photos</h4><p>All {photos.length} view{photos.length === 1 ? " is" : "s are"} staying visible while Hojavía looks for brand, line, vitola, packaging, and date clues.</p><div className={searchStyles.photoStrip} aria-label={`${photos.length} photos being reviewed`}>{photos.map((photo, index) => <img className={index === searchPhotoIndex ? searchStyles.current : undefined} key={photo.url} src={photo.url} alt={photo.name}/>)}</div><div className={searchStyles.searchStatus}><i aria-hidden="true" /><strong>Comparing visible details…</strong></div><small>AI suggestions are not authentication. You will review and correct every proposed field before anything can be saved.</small></div>
      </section>}
      <div className="intakeStageActions"><button type="button" className="button secondary" onClick={() => { setAnalysis(null); setStage("review"); setMessage("Enter the details you know. Uncertain fields can stay blank."); }}>Enter details manually</button></div>
    </section>}

    {stage === "review" && <section className="intakeStage" aria-labelledby="review-stage-title">
      <div className="intakeStageHead"><div><div className="eyebrow">Step 2 of 3</div><h3 id="review-stage-title">Review before saving.</h3><p>Suggestions are not authentication. Correct anything uncertain and leave unknown fields blank.</p></div><button type="button" className="textLink" onClick={() => setStage("identify")}>← Back to identification</button></div>
      <div className="photoIntakeLayout">{photos.length > 0 && <div className="reviewPhotos"><div className="photoPreviewGrid">{photos.map((photo) => <img key={photo.url} src={photo.url} alt={photo.name}/>)}</div><small>{photos.length} selected photo{photos.length === 1 ? "" : "s"}</small></div>}
        <form key={`intake-${captureSession}`} onSubmit={createDraft}>
          <label><span>Evidence type</span><select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}>{evidenceTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Brand *</span><input value={brand} onChange={(event) => { setBrand(event.target.value); setLine(""); }} list="photo-brand-options" required/><datalist id="photo-brand-options">{brands.map((value) => <option key={value} value={value}/>)}</datalist></label>
          <label><span>Line *</span><input value={line} onChange={(event) => setLine(event.target.value)} list="photo-line-options" required/><datalist id="photo-line-options">{lines.map((value) => <option key={value} value={value}/>)}</datalist></label>
          <VitolaField value={vitola} onChange={setVitola} catalogVitolas={vitolas} constrained={Boolean(brand && line)} help={brand && line && vitolas.length ? `${vitolas.length} researched vitola${vitolas.length === 1 ? "" : "s"} available for this exact cigar.` : brand && line ? "No confirmed list yet; use Other / custom rather than guessing." : "Select a brand and line to narrow the vitolas."}/>
          <label><span>Release / vintage year</span><select value={vintage} onChange={(event) => setVintage(event.target.value)}><option value="">Choose the documented year</option>{recentYearOptions(vintage).map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          <label><span>Packaging</span><input value={packaging} onChange={(event) => setPackaging(event.target.value)}/></label>
          <label><span>Full boxes</span><input type="number" min="0" value={fullBoxQty} onChange={(event) => setFullBoxQty(event.target.value)}/></label>
          <label><span>Cigars per box</span><input type="number" min="1" value={sticksPerBox} onChange={(event) => setSticksPerBox(event.target.value)}/></label>
          <label><span>Loose sticks</span><input type="number" min="0" value={looseStickQty} onChange={(event) => setLooseStickQty(event.target.value)}/></label>
          {analysis && <div className={`visionEvidence confidence-${analysis.confidence}`}><strong>{analysis.confidence} confidence</strong><p>{analysis.evidenceSummary}</p>{analysis.uncertainties.length > 0 && <small><b>Details to confirm:</b> {analysis.uncertainties.join(" · ")}</small>}</div>}
          {duplicates.length > 0 && <div className="duplicateReview"><strong>Possible duplicate — review before saving</strong><p>This may already be in your Vault. Open the existing lot in a new tab and confirm before continuing.</p>{duplicates.map((candidate) => <a href={`/inventory/${encodeURIComponent(candidate.item.inventoryId)}`} target="_blank" rel="noreferrer" key={candidate.item.inventoryId}>{candidate.item.brand} · {candidate.item.line} · {candidate.item.vitola} ({candidate.score}% match)</a>)}</div>}
          <div className="intakePrimaryAction"><button className="button">Continue to final review</button><small>Nothing is saved to your Vault until you confirm it in the next step.</small></div>
        </form>
      </div>
    </section>}

    {stage === "saved" && readyForAnother && <section ref={completion} tabIndex={-1} className="intakeCompletion" aria-labelledby="saved-stage-title"><div className="eyebrow">Step 3 of 3 · Final review</div><h3 id="saved-stage-title">Your work is saved on this screen.</h3><p>Confirm this lot below. The details are ready, but the cigar has not been added to your Vault yet.</p><small>Document another cigar after this one, or return to your Vault.</small><div><button type="button" className="button" onClick={nextAsset}>Enter another cigar</button><a className="button secondary" href="/inventory#inventory-records">Return to Vault</a></div></section>}
    {message && <output ref={messageOutput} tabIndex={-1} className="intakeMessage" role="status" aria-live="polite" aria-atomic="true">{message}</output>}
    {photoFailures.length > 0 && <div className="photoRetryList" aria-label="Photo attachment follow-up">{photoFailures.map((failure) => <article key={failure.inventoryId}><strong>{failure.inventoryId} was saved</strong><small>{failure.reason}</small><a href={`/inventory/${encodeURIComponent(failure.inventoryId)}#record-tools`}>Open saved record and attach photo →</a></article>)}</div>}

    {queue.length > 0 && <section className="intakeQueue"><div className="intakeQueueHead"><div><div className="eyebrow">Final review</div><h3>{queue.length} proposed record{queue.length === 1 ? "" : "s"}</h3><small>{pending} selected · not yet added to your Vault</small></div>{stage !== "saved" && <button type="button" className="button secondary" onClick={nextAsset}>Document another cigar</button>}</div>
      <div className="intakeQueueList">{queue.map((entry, index) => <article className={entry.duplicateCount && !entry.acknowledged ? "attention" : "ready"} key={entry.draft.inventoryId}><input type="checkbox" aria-label={`Select draft ${index + 1}`} checked={entry.selected} onChange={(event) => setQueue((current) => current.map((item) => item.draft.inventoryId === entry.draft.inventoryId ? { ...item, selected: event.target.checked } : item))}/><div><span>Draft {index + 1}</span><strong>{entry.draft.brand} · {entry.draft.line}</strong><small>{entry.draft.vitola} · {entry.photoNames.length} photo(s) · {entry.confidence}</small></div><b>{entry.duplicateCount ? `${entry.duplicateCount} possible duplicate(s)` : entry.uncertaintyCount ? `${entry.uncertaintyCount} detail check(s)` : "Ready"}</b><div><button type="button" onClick={() => onDraft(entry.draft)}>Edit</button>{entry.duplicateCount > 0 && <label className="acknowledge"><input type="checkbox" checked={entry.acknowledged} onChange={(event) => setQueue((current) => current.map((item) => item.draft.inventoryId === entry.draft.inventoryId ? { ...item, acknowledged: event.target.checked } : item))}/>Reviewed</label>}<button type="button" className="danger" onClick={() => setQueue((current) => current.filter((item) => item.draft.inventoryId !== entry.draft.inventoryId))}>Remove</button></div></article>)}</div>
      <form className="intakeApproval" onSubmit={approve} aria-busy={approving}>{mode === "smartsheet" && <fieldset className="founderMasterControls"><legend>Founder-only options</legend><label><input name="syncMaster" type="checkbox"/> Also save selected records to the founder’s master list</label><label><span>Founder write key *</span><input name="writeKey" type="password" required/></label></fieldset>}<button className="button" disabled={!pending||approving}>{approving ? "Adding to Vault…" : `Add ${pending} selected cigar${pending === 1 ? "" : "s"} to my Vault`}</button></form>
    </section>}
  </section>;
}
