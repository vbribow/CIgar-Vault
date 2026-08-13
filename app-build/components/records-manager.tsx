"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem, SmokingLog, Valuation } from "@/lib/types";
import { smokeEntryOrder } from "@/lib/smoke-journal";
import { mutationButtonText } from "@/lib/mutation-state";
import { useMutationGuard } from "@/components/use-mutation-guard";
import { claimsUnverifiedCompletedSale, completedSaleLabel, isVerifiedCompletedSale, marketAskingPriceLabel, marketEvidenceType } from "@/lib/valuation-evidence";
import { burnQualityOptions, constructionQualityOptions } from "@/lib/records-model";
import { createClientUuid } from "@/lib/client-uuid";
import { readSaveResponse, saveRecoveryMessage } from "@/lib/save-recovery";
import { useUnsavedChanges } from "@/components/use-unsaved-changes";
import { useDeviceFormDraft } from "@/components/use-device-form-draft";
import { valuationRetailLead,type ValuationResearch } from "@/lib/valuation-research";
import type { CigarVisionResult } from "@/lib/cigar-vision";
import { photoPreparationError, validatePhotoSelection } from "@/lib/photo-capture";
import { captureOperationalFailure, captureOperationalSuccess } from "@/lib/operational-failure";
import { fetchWithConfirmationRetry, fetchWithTimeout, RequestTimeoutError } from "@/lib/request-control";
import { matchesInventorySearchForgiving } from "@/lib/cigar-search";

const today = () => new Date().toISOString().slice(0, 10);const scoreOptions = Array.from({ length: 101 }, (_, index) => 100 - index);
function normalizeSmokeSearch(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\btaurus\b/g, "tauros").replace(/\bopus x\b/g, "opusx").trim();
}
export function matchesSmokeInventory(item: InventoryItem, query: string) {
  return matchesInventorySearchForgiving(item,query);
}
export function compareSmokeInventory(left: InventoryItem, right: InventoryItem) {
  const leftFamily = normalizeSmokeSearch(`${left.brand} ${left.line}`);
  const rightFamily = normalizeSmokeSearch(`${right.brand} ${right.line}`);
  return leftFamily.localeCompare(rightFamily, undefined, { numeric: true })
    || normalizeSmokeSearch(left.vitola).localeCompare(normalizeSmokeSearch(right.vitola), undefined, { numeric: true })
    || String(left.vintage || "").localeCompare(String(right.vintage || ""), undefined, { numeric: true })
    || left.inventoryId.localeCompare(right.inventoryId, undefined, { numeric: true });
}
function smokeSaveMessage(result: { collector25?: { status?: string } }, manual: boolean, quantitySmoked: number) {
  const deduction = manual ? "No Vault quantity changed." : `${quantitySmoked} cigar${quantitySmoked === 1 ? "" : "s"} removed from the selected Vault lot.`;
  if (result.collector25?.status === "contributed") return `Smoking experience saved. ${deduction} Your anonymous score updated the Hojavía 25.`;
  if (result.collector25?.status === "ineligible") return `Smoking experience saved. ${deduction} An exact Vault identity and a 1–100 score are required for the Hojavía 25.`;
  if (result.collector25?.status === "unavailable") return `Smoking experience saved safely. ${deduction} The Hojavía 25 could not update right now.`;
  return `Smoking experience saved to your private journal. ${deduction}`;
}
export const strengthOptions = ["Mild", "Mild–medium", "Medium", "Medium–full", "Full"] as const;
export const flavorOptions = ["Cedar", "Earth", "Leather", "Pepper", "Cream", "Coffee", "Cocoa / chocolate", "Nuts", "Sweetness", "Baking spice", "Fruit", "Floral", "Toast", "Mineral", "Other"] as const;
export function smokeRequiredFieldMessage(name: string) {
  if (name === "inventoryId") return "Choose ‘Remove from my Vault’ and select the exact lot, or choose ‘Do not remove from my Vault’ for a cigar outside your inventory.";
  if (name === "cigarName") return "Enter the cigar’s brand, line, and exact vitola before saving.";
  if (name === "cigarBrand") return "Enter the cigar brand so this scored smoke has an exact identity.";
  if (name === "cigarLine") return "Enter the exact line or blend so this scored smoke has an exact identity.";
  if (name === "cigarVitola") return "Enter the exact vitola so this scored smoke has an exact identity.";
  if (name === "quantitySmoked") return "Enter how many cigars were smoked from this lot.";
  if (name === "dateSmoked") return "Choose the date smoked before saving.";
  if (name === "writeKey") return "Enter the founder write key before saving.";
  return "Complete the highlighted required field before saving.";
}

export function RecordsManager({ inventory, initialSmokes, initialValuations, mode, selectedInventoryId,initialManualName }: {
  inventory: InventoryItem[];
  initialSmokes: SmokingLog[];
  initialValuations: Valuation[];
  mode: DataMode;
  selectedInventoryId?: string;
  initialManualName?:string;
}) {
  const [smokes, setSmokes] = useState(initialSmokes);
  const [valuations, setValuations] = useState(initialValuations);
  const [message, setMessage] = useState("");
  const [smokeSourceMode, setSmokeSourceMode] = useState<"UNDECIDED" | "VAULT" | "MANUAL">(initialManualName ? "MANUAL" : selectedInventoryId ? "VAULT" : "UNDECIDED");
  const [smokeSource, setSmokeSource] = useState(initialManualName?"MANUAL":selectedInventoryId || "");
  const [smokeInventoryQuery, setSmokeInventoryQuery] = useState("");
  const [smokeCigarName, setSmokeCigarName] = useState(initialManualName||"");
  const [outsideIdentity, setOutsideIdentity] = useState({ confirmed:false, brand:"", line:"", vitola:"" });
  const [smokePhotos, setSmokePhotos] = useState<File[]>([]);
  const [smokePhotoAnalysis, setSmokePhotoAnalysis] = useState<CigarVisionResult>();
  const [smokePhotoBusy, setSmokePhotoBusy] = useState(false);
  const [smokePhotoMessage, setSmokePhotoMessage] = useState("");
  const [smokeCameraSession, setSmokeCameraSession] = useState(0);
  const smokePhotoRequest = useRef(0);
  const smokeSaveFeedback = useRef<HTMLOutputElement>(null);
  const [smokeSubmissionId, setSmokeSubmissionId] = useState(createClientUuid);
  const [valuationSubmissionId, setValuationSubmissionId] = useState(createClientUuid);
  const [valuationSource, setValuationSource] = useState(selectedInventoryId || "");
  const [valuationProposal, setValuationProposal] = useState<ValuationResearch>();
  const [valuationResearching, setValuationResearching] = useState(false);
  const [valuationResearchMessage, setValuationResearchMessage] = useState("");
  const [manualValuation, setManualValuation] = useState(false);
  const [newSmokeConfirmed, setNewSmokeConfirmed] = useState(false);
  const [lastSmokeIdentity, setLastSmokeIdentity] = useState<{ source: string; cigarName: string; outsideIdentity:typeof outsideIdentity }>();
  const smokeMutation = useMutationGuard();
  const valuationMutation = useMutationGuard();
  const recordSafety = useUnsavedChanges();
  const smokeDraft = useDeviceFormDraft("hojavia:form-draft:smoke:v1");
  const valuationFormDraft = useDeviceFormDraft("hojavia:form-draft:valuation:v1");
  const smokePhotoPreviews = useMemo(() => smokePhotos.map(file => ({ name: file.name, url: URL.createObjectURL(file) })), [smokePhotos]);
  const smokeInventoryMatches = useMemo(() => inventory.filter(item => matchesSmokeInventory(item, smokeInventoryQuery)).sort(compareSmokeInventory), [inventory, smokeInventoryQuery]);
  const visibleSmokeInventoryMatches = useMemo(() => smokeInventoryMatches.slice(0, smokeInventoryQuery ? 100 : 40), [smokeInventoryMatches, smokeInventoryQuery]);
  const selectedSmokeInventory = useMemo(() => inventory.find(item => item.inventoryId === smokeSource), [inventory, smokeSource]);
  const smokeQuantityBlocked = Boolean(selectedSmokeInventory && (!selectedSmokeInventory.currentQty || selectedSmokeInventory.currentQty < 1));

  useEffect(() => () => smokePhotoPreviews.forEach(photo => URL.revokeObjectURL(photo.url)), [smokePhotoPreviews]);

  useEffect(() => {
    const restoredSource = smokeDraft.restoredFields?.inventoryId?.[0];
    if (restoredSource) { setSmokeSource(restoredSource); setSmokeSourceMode(restoredSource === "MANUAL" ? "MANUAL" : "VAULT"); }
    const restoredName = smokeDraft.restoredFields?.cigarName?.[0];
    if (restoredName) setSmokeCigarName(restoredName);
    setOutsideIdentity(current=>({confirmed:Boolean(smokeDraft.restoredFields?.outsideInventory?.length),brand:smokeDraft.restoredFields?.cigarBrand?.[0]||current.brand,line:smokeDraft.restoredFields?.cigarLine?.[0]||current.line,vitola:smokeDraft.restoredFields?.cigarVitola?.[0]||current.vitola}));
  }, [smokeDraft.restoredFields]);

  async function send(event: FormEvent<HTMLFormElement>, kind: "smoke" | "valuation") {
    event.preventDefault();
    const mutation = kind === "smoke" ? smokeMutation : valuationMutation;
    const formElement = event.currentTarget;
    formElement.querySelectorAll("[aria-invalid='true']").forEach(control => control.removeAttribute("aria-invalid"));
    if (kind === "smoke" && !formElement.checkValidity()) {
      if (!mutation.begin()) return;
      const invalid = formElement.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input:invalid, select:invalid, textarea:invalid");
      invalid?.setAttribute("aria-invalid", "true");
      mutation.fail();
      setMessage(smokeRequiredFieldMessage(invalid?.name || ""));
      window.setTimeout(() => {
        invalid?.focus({ preventScroll: true });
        invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        invalid?.reportValidity();
      }, 0);
      return;
    }
    if (!mutation.begin()) return;
    const form = new FormData(formElement);
    const key = String(form.get("writeKey") || "");
    const numeric = new Set(["overall", "quantitySmoked", "replacementValue", "marketValue", "marketRangeLow", "marketRangeHigh", "askingPrice", "comparableCount", "lastSaleValue"]);
    const boolean = new Set(["buyAgain", "outsideInventory"]);
    const excluded = new Set(["writeKey", "flavor1", "flavor2", "flavor3"]);
    const payload: Record<string, unknown> = Object.fromEntries([...form.entries()].flatMap(([name, value]) =>
      excluded.has(name) || value === "" ? [] : [[name, numeric.has(name) ? Number(value) : boolean.has(name) ? value === "on" : value]],
    ));
    if (kind === "smoke") {
      payload.submissionId = smokeSubmissionId;
      if (newSmokeConfirmed) payload.newEntryConfirmed = true;
      const flavors = [...new Set(["flavor1", "flavor2", "flavor3"].map(name => String(form.get(name) || "")).filter(Boolean))];
      if (flavors.length) payload.flavor = flavors.join(", ");
    } else payload.submissionId = valuationSubmissionId;
    const finishSmokeSave = (result: { data: SmokingLog; collector25?: { status?: string } }, status: number) => {
      smokePhotoRequest.current += 1;
      void captureOperationalSuccess("smoke-save",status);
      setSmokes(values => values.some(value => value.smokeId === result.data.smokeId) ? values : [result.data, ...values]);
      setLastSmokeIdentity({ source: smokeSource, cigarName: smokeCigarName, outsideIdentity });
      setMessage(smokeSaveMessage(result, smokeSource === "MANUAL", Number(payload.quantitySmoked ?? 1)));
      mutation.succeed();
      formElement.reset();
      smokeDraft.clear();
      recordSafety.markSaved();
      setSmokeSubmissionId(createClientUuid());
      setNewSmokeConfirmed(false);
      setSmokeSource(selectedInventoryId || "");
      setSmokeCigarName("");
      setOutsideIdentity({confirmed:false,brand:"",line:"",vitola:""});
      setSmokePhotos([]);
      setSmokePhotoAnalysis(undefined);
      setSmokePhotoMessage("");
      setSmokePhotoBusy(false);
      setSmokeCameraSession(current=>current+1);
    };
    let failureStatus=0;
    try {
      const endpoint = kind === "smoke" ? "/api/smoking-log" : "/api/valuations";
      const request = {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-founder-key": key },
        body: JSON.stringify(payload),
      };
      const response = kind === "smoke"
        ? await fetchWithConfirmationRetry(endpoint, request, 20_000)
        : await fetchWithTimeout(endpoint, request, 15_000);
      failureStatus=response.status;
      const result = await readSaveResponse(response);
      if (!response.ok) throw new Error(result.error || "Save failed");
      if (kind === "smoke") {
        finishSmokeSave(result,response.status);
        return;
      }
      else {
        setValuations(values => values.some(value => value.valuationId === result.data.valuationId) ? values : [result.data, ...values]);
      }
      setMessage("Valuation evidence saved to your private Vault.");
      mutation.succeed();
      formElement.reset();
      valuationFormDraft.clear();
      recordSafety.markSaved();
      setValuationSubmissionId(createClientUuid());
    } catch (error) {
      if (kind === "smoke" && (error instanceof RequestTimeoutError || error instanceof TypeError)) {
        try {
          const confirmation = await fetchWithTimeout(`/api/smoking-log?submissionId=${encodeURIComponent(smokeSubmissionId)}`, { cache:"no-store" }, 12_000);
          const confirmed = await readSaveResponse(confirmation);
          if (confirmation.ok && confirmed.data) {
            finishSmokeSave({ data:confirmed.data, collector25:{ status:"unavailable" } },confirmation.status);
            return;
          }
        } catch {/* Continue to the retained-form recovery state when confirmation is also unavailable. */}
      }
      if(kind==="smoke")void captureOperationalFailure("smoke-save",failureStatus);
      mutation.fail();
      setMessage(saveRecoveryMessage(error, kind === "smoke" ? "this smoking experience" : "this valuation evidence"));
      if (kind === "smoke") window.setTimeout(() => {
        smokeSaveFeedback.current?.focus({ preventScroll: true });
      }, 0);
    }
  }

  function startAnotherSmoke(reuseIdentity = false) {
    smokePhotoRequest.current += 1;
    smokeMutation.reset();
    setNewSmokeConfirmed(true);
    setSmokeSubmissionId(createClientUuid());
    setSmokeSource(reuseIdentity ? lastSmokeIdentity?.source || selectedInventoryId || "" : selectedInventoryId || "");
    setSmokeSourceMode(reuseIdentity ? (lastSmokeIdentity?.source === "MANUAL" ? "MANUAL" : "VAULT") : selectedInventoryId ? "VAULT" : "UNDECIDED");
    setSmokeCigarName(reuseIdentity ? lastSmokeIdentity?.cigarName || "" : "");
    setOutsideIdentity(reuseIdentity ? lastSmokeIdentity?.outsideIdentity || {confirmed:false,brand:"",line:"",vitola:""} : {confirmed:false,brand:"",line:"",vitola:""});
    setSmokePhotos([]);
    setSmokePhotoAnalysis(undefined);
    setSmokePhotoMessage("");
    setSmokePhotoBusy(false);
    setSmokeCameraSession(current=>current+1);
    setMessage("");
    window.setTimeout(() => document.querySelector<HTMLSelectElement>('#smoke-inventory-source')?.focus(), 0);
  }

  function chooseSmokePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    const error = validatePhotoSelection([], files);
    if (error) { setSmokePhotoMessage(error); return; }
    setSmokePhotos(files);
    setSmokePhotoAnalysis(undefined);
    setSmokePhotoMessage(`${files.length} photo${files.length === 1 ? " is" : "s are"} ready. Identification will not add anything to your Vault.`);
  }

  async function prepareSmokePhoto(file: File) {
    const image = document.createElement("img"), source = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(photoPreparationError(file.name))); image.src = source; });
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight)), canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d"); if (!context) throw new Error(photoPreparationError(file.name));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error(photoPreparationError(file.name))), "image/jpeg", .72));
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
    } finally { image.onload=null;image.onerror=null;image.src="";URL.revokeObjectURL(source); }
  }

  async function identifySmokePhotos() {
    if (!smokePhotos.length || smokePhotoBusy) return;
    const requestId = ++smokePhotoRequest.current;
    setSmokePhotoBusy(true); setSmokePhotoMessage("");
    try {
      const form = new FormData();
      for (const file of smokePhotos) form.append("photos", await prepareSmokePhoto(file));
      const response = await fetchWithTimeout("/api/photo-identification", { method: "POST", body: form }, 25_000);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Photo identification failed");
      const analysis = result.data as CigarVisionResult;
      const identity = [analysis.brand, analysis.line, analysis.vitola, analysis.vintage].filter(Boolean).join(" ");
      if (requestId !== smokePhotoRequest.current) return;
      setSmokePhotoAnalysis(analysis); setSmokeCigarName(identity); setOutsideIdentity(current=>({...current,brand:analysis.brand||"",line:analysis.line||"",vitola:analysis.vitola||""}));
      setSmokePhotoMessage(`Identification ready (${analysis.confidence} confidence). Confirm or correct the cigar before saving your review.`);
    } catch (error) { if (requestId === smokePhotoRequest.current) setSmokePhotoMessage(error instanceof RequestTimeoutError ? "Identification is taking longer than expected. Your photos are still selected—try again when you’re ready." : error instanceof Error ? error.message : "Photo identification failed"); }
    finally { if (requestId === smokePhotoRequest.current) setSmokePhotoBusy(false); }
  }

  function startAnotherValuation() {
    valuationMutation.reset();
    setValuationSubmissionId(createClientUuid());
    setMessage("");
    setValuationProposal(undefined);
    setManualValuation(false);
  }

  async function researchValuation() {
    if (!valuationSource || valuationResearching) return;
    setValuationResearching(true);
    setValuationResearchMessage("");
    try {
      const response = await fetch("/api/valuation-research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inventoryId: valuationSource }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Valuation research could not be completed");
      setValuationProposal(result.data);
      setManualValuation(false);
      setValuationResearchMessage("Research complete. Review every proposed field before saving.");
    } catch (error) {
      setValuationResearchMessage(error instanceof Error ? error.message : "Valuation research could not be completed");
    } finally {
      setValuationResearching(false);
    }
  }

  const valuationPicker = <select name="inventoryId" required value={valuationSource} onChange={event => { setValuationSource(event.target.value); setValuationProposal(undefined); setManualValuation(false); setValuationResearchMessage(""); }}>
    <option value="">Select inventory lot</option>
    {inventory.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}</option>)}
  </select>;
  const existingValuation = valuations.find(value => value.inventoryId === valuationSource);
  const proposed = valuationProposal;
  const showValuationForm = Boolean(proposed || manualValuation || existingValuation);
  const value = <T,>(researched: T | null | undefined, existing: T | undefined) => researched ?? existing ?? "";

  return <div className="recordsGrid" onChange={recordSafety.markDirty}>
    <section className="card smokeJournal" id="log-smoke">
      <div className="eyebrow">Private tasting journal</div>
      <h2>Log a smoke</h2>
      <p className="small">Record any cigar you smoke—whether it came from your Vault, a lounge, a friend, or somewhere new. There are no wrong tasting notes.</p>
      <div className="smokeStartChoices" aria-label="Should this smoke reduce your Vault inventory?">
        <button type="button" className={smokeSourceMode === "MANUAL" ? "active" : ""} onClick={() => { setSmokeSourceMode("MANUAL"); setSmokeSource("MANUAL"); setSmokeInventoryQuery(""); setSmokePhotoMessage(""); }}><strong>Do not remove from my Vault</strong><small>For a gift, lounge cigar, or separate purchase. Identify it by photo or type its name; Vault quantities stay unchanged.</small></button>
        <button type="button" className={smokeSourceMode === "VAULT" ? "active" : ""} onClick={() => { setSmokeSourceMode("VAULT"); setSmokeSource(selectedInventoryId || ""); setSmokePhotoMessage(""); window.setTimeout(() => document.querySelector<HTMLInputElement>('#smoke-inventory-search')?.focus({ preventScroll: true }), 0); }}><strong>Remove from my Vault</strong><small>Select the exact owned lot and choose how many cigars to remove.</small></button>
        <a href="/inventory#mobile-intake"><strong>Add to Vault first</strong><small>Create and verify the inventory lot before logging its smoke.</small></a>
      </div>
      {smokeDraft.restoredFields && <p className="deviceDraftNotice" role="status">Unfinished tasting details were restored from this browser profile. Review them before saving.</p>}
      <form ref={smokeDraft.formRef} className="recordForm" noValidate onSubmit={event => send(event, "smoke")} onChange={smokeDraft.capture} aria-busy={smokeMutation.pending}>
        <fieldset disabled={smokeMutation.pending || smokeMutation.complete || smokePhotoBusy}>
        {smokeSourceMode === "VAULT" && <div className="smokeInventoryFinder">
          <label htmlFor="smoke-inventory-search"><span>Search my Vault</span><input id="smoke-inventory-search" type="search" value={smokeInventoryQuery} onChange={event => setSmokeInventoryQuery(event.target.value)} placeholder="Type brand, line, vitola, or inventory ID" autoComplete="off" /></label>
          <small role="status" aria-live="polite">{smokeInventoryQuery ? `${smokeInventoryMatches.length} matching lot${smokeInventoryMatches.length === 1 ? "" : "s"}` : `${inventory.length} owned lots available`}</small>
        </div>}
        {smokeSourceMode === "VAULT" && <label><span>{smokeInventoryQuery ? "Choose the matching Vault lot *" : "Choose the Vault lot *"}</span><select id="smoke-inventory-source" name="inventoryId" required value={smokeSource} onChange={event => { setSmokeSource(event.target.value); setSmokePhotoMessage(""); }}>
          <option value="">Select the exact inventory lot</option>
          {visibleSmokeInventoryMatches.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}{item.currentQty !== undefined ? ` · ${item.currentQty} remaining` : " · quantity required"}</option>)}
        </select></label>}
        {smokeSourceMode === "VAULT" && smokeInventoryMatches.length > visibleSmokeInventoryMatches.length && <p className="deviceDraftNotice" role="status">Showing the first {visibleSmokeInventoryMatches.length} of {smokeInventoryMatches.length} lots. Type more of the brand, line, vitola, or inventory ID to narrow the list.</p>}
        {smokeSourceMode === "VAULT" && smokeInventoryQuery && smokeInventoryMatches.length === 0 && <p className="deviceDraftNotice" role="status">No Vault match found. Check the spelling, clear the search to browse every lot, or choose “Do not remove from my Vault” above.</p>}
        {selectedSmokeInventory && selectedSmokeInventory.currentQty !== undefined && selectedSmokeInventory.currentQty > 0 && <label><span>Cigars smoked from this lot *</span><input name="quantitySmoked" type="number" min="1" max={selectedSmokeInventory.currentQty} step="1" defaultValue="1" required /><small>{selectedSmokeInventory.currentQty} remaining before this entry. Saving removes exactly the number entered; original quantity stays unchanged.</small></label>}
        {selectedSmokeInventory && smokeQuantityBlocked && <p className="deviceDraftNotice" role="alert">{selectedSmokeInventory.currentQty === 0 ? "This lot has no cigars remaining." : "Record this lot’s remaining quantity before logging a smoke."} <a href={`/inventory?edit=${encodeURIComponent(selectedSmokeInventory.inventoryId)}&vaultSearch=${encodeURIComponent(selectedSmokeInventory.inventoryId)}&focus=quantity#inventory-editor`}>Correct this exact record →</a></p>}
        {smokeSourceMode === "MANUAL" && <div className="manualSmokeIdentity">
          <input type="hidden" name="inventoryId" value="MANUAL" data-draft-safe="true" />
          <div className="smokePhotoIdentify" key={`smoke-camera-${smokeCameraSession}`}><div><strong>Identify by photo</strong><small>Photograph the cigar or band. Hojavía proposes an identity; you approve or correct it. Identification may use configured AI credits.</small></div><label className="cameraCapture"><input type="file" accept="image/*" capture="environment" onChange={chooseSmokePhotos}/><span>Take a photo</span></label><label className="photoDrop compact"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseSmokePhotos}/><span>Choose photos</span></label><button type="button" className="button secondary" disabled={!smokePhotos.length || smokePhotoBusy} onClick={identifySmokePhotos}>{smokePhotoBusy ? "Identifying…" : "Identify cigar"}</button></div>
          {smokePhotoPreviews.length > 0 && <section className="smokePhotoProgress" aria-label={`${smokePhotoPreviews.length} selected cigar photo${smokePhotoPreviews.length === 1 ? "" : "s"}`} aria-busy={smokePhotoBusy}>
            <div>{smokePhotoPreviews.map(photo => <img key={photo.url} src={photo.url} alt={`Selected cigar evidence: ${photo.name}`} />)}</div>
            <p role="status" aria-live="polite"><strong>{smokePhotoBusy ? "Comparing visible details…" : "Photos ready for review"}</strong><span>{smokePhotoBusy ? "Hojavía is looking for brand, line, vitola, packaging, and date clues." : "You can identify these photos now or replace them before continuing."}</span></p>
          </section>}
          {smokePhotoMessage && <output className="smokePhotoMessage" aria-live="polite">{smokePhotoMessage}</output>}
          {smokePhotoAnalysis && <div className={`visionEvidence confidence-${smokePhotoAnalysis.confidence}`}><strong>{smokePhotoAnalysis.confidence} confidence · review required</strong><p>{smokePhotoAnalysis.evidenceSummary}</p>{smokePhotoAnalysis.uncertainties.length > 0 && <small><b>Confirm:</b> {smokePhotoAnalysis.uncertainties.join(" · ")}</small>}</div>}
          <label className="manualSmokeCigar"><span>What did you smoke? *</span><input name="cigarName" required minLength={3} maxLength={300} value={smokeCigarName} onChange={event => setSmokeCigarName(event.target.value)} placeholder="Brand, line, exact vitola, and year if known" /><small>Review and correct photo suggestions. Saving creates only a private smoking review—no Vault record and no quantity change.</small></label>
          <fieldset className="outsideVaultIdentity"><legend>Confirm the cigar identity</legend>
            <label className="check"><input name="outsideInventory" type="checkbox" checked={outsideIdentity.confirmed} onChange={event=>setOutsideIdentity(current=>({...current,confirmed:event.target.checked}))}/> I can confirm the exact brand, line, and vitola.</label>
            <small>A scored smoke contributes its exact identity and numeric score anonymously. Notes, purchase details, inventory, and location are never shared.</small>
            {outsideIdentity.confirmed&&<div className="outsideVaultIdentityFields">
              <label><span>Brand *</span><input name="cigarBrand" required value={outsideIdentity.brand} onChange={event=>setOutsideIdentity(current=>({...current,brand:event.target.value}))}/></label>
              <label><span>Line or blend *</span><input name="cigarLine" required value={outsideIdentity.line} onChange={event=>setOutsideIdentity(current=>({...current,line:event.target.value}))}/></label>
              <label><span>Exact vitola *</span><input name="cigarVitola" required value={outsideIdentity.vitola} onChange={event=>setOutsideIdentity(current=>({...current,vitola:event.target.value}))}/></label>
            </div>}
          </fieldset>
        </div>}
        <label><span>Date</span><input name="dateSmoked" type="date" required defaultValue={today()} /></label>
        <label><span>Score · 0–100</span><select name="overall" defaultValue=""><option value="">Choose a score</option>{scoreOptions.map(score => <option value={score} key={score}>{score}</option>)}</select><small>An exact Vault cigar—or a confirmed outside-Vault identity—and 1–100 score update your anonymous Hojavía 25 contribution. Notes and inventory stay private.</small></label>
        <label><span>Strength</span><select name="strength" defaultValue=""><option value="">Choose perceived strength</option>{strengthOptions.map(value => <option key={value}>{value}</option>)}</select><small>How the nicotine intensity felt—not the depth of flavor.</small></label>
        <label><span>Construction Quality</span><select name="construction" defaultValue=""><option value="">Optional</option>{constructionQualityOptions.map(value => <option key={value}>{value}</option>)}</select><small>How well the cigar was physically made—not its flavor or strength.</small></label>
        <label><span>Burn</span><select name="burn" defaultValue=""><option value="">Optional</option>{burnQualityOptions.map(value => <option key={value}>{value}</option>)}</select><small>How evenly the cigar burned and whether it needed correction.</small></label>
        <fieldset className="flavorChoices"><legend>Flavor notes · choose up to 3</legend>{[1, 2, 3].map(index => <label key={index}><span>Flavor {index}</span><select name={`flavor${index}`} defaultValue=""><option value="">{index === 1 ? "Choose a primary note" : "Optional"}</option>{flavorOptions.map(value => <option key={value}>{value}</option>)}</select></label>)}<small>Choose broad impressions. Add anything more specific in your tasting notes.</small></fieldset>
        <label><span>Tasting notes</span><textarea name="tastingNotes" rows={4} placeholder="How did it begin, develop, and finish? What stood out?" /></label>
        <label className="check"><input name="buyAgain" type="checkbox" /> Buy again</label>
        {mode === "smartsheet" && <label><span>Founder write key</span><input name="writeKey" type="password" required /></label>}
        {message && smokeMutation.status !== "idle" && <output ref={smokeSaveFeedback} className="wideMessage deviceDraftNotice" tabIndex={-1} role={smokeMutation.status === "error" ? "alert" : "status"} aria-live="polite" aria-atomic="true">{message}</output>}
        <button type="submit" className="button" disabled={mode === "mock" || smokeQuantityBlocked || smokePhotoBusy || smokeMutation.pending || smokeMutation.complete}>{mutationButtonText(smokeMutation.status,{idle:"Save smoke",pending:"Saving smoke…",success:"Smoke saved",error:"Check save status"})}</button>
        </fieldset>
      </form>
      {smokeMutation.complete && <section className="mutationCompletion" role="status" aria-live="polite" aria-labelledby="smoke-saved-title"><strong id="smoke-saved-title">Smoke saved.</strong><p>Continue without refreshing or searching for this journal again.</p><div><button type="button" className="button" onClick={() => startAnotherSmoke(true)}>Log this cigar again</button><button type="button" className="button secondary" onClick={() => startAnotherSmoke(false)}>Log another</button>{lastSmokeIdentity?.source&&lastSmokeIdentity.source!=="MANUAL"&&<a className="button secondary" href={`/inventory/${encodeURIComponent(lastSmokeIdentity.source)}`}>Open cigar record</a>}<a className="textLink" href="/inventory">Return to Vault</a></div></section>}
      <div className="recordList" id="smoking-history"><div className="recordListHeader"><h3>Recent smokes</h3><a className="textLink" href="/smoke-journal">View and search every smoke →</a></div>{smokes.slice(0, 8).map(smoke => <div id={`smoke-${smoke.smokeId}`} key={smoke.smokeId}><strong>{smoke.cigarName || smoke.inventoryId}</strong><span>Entry #{smokeEntryOrder(smokes, smoke.smokeId)} · {smoke.dateSmoked} · {smoke.quantitySmoked ?? 1} cigar{(smoke.quantitySmoked ?? 1) === 1 ? "" : "s"} · {smoke.overall ?? "—"}</span><a className="textLink" href={`/smoke-journal?editSmoke=${encodeURIComponent(smoke.smokeId)}#smoke-${encodeURIComponent(smoke.smokeId)}`}>Edit smoke →</a></div>)}</div>
    </section>

    <section className="card valuationIntake">
      <div><div className="eyebrow">Evidence-led valuation</div><h2>Add valuation evidence</h2><p className="small">Choose the cigar first. Hojavía can reuse its latest saved evidence at no research cost, or prepare new source-backed proposals for your review. Nothing is saved until you approve the form.</p></div>
      <label><span>Inventory lot</span>{valuationPicker}</label>
      {valuationSource && <div className="valuationIntakeActions"><button type="button" className="button" onClick={researchValuation} disabled={valuationResearching}>{valuationResearching ? "Researching exact evidence…" : "Research this cigar"}</button><button type="button" className="button secondary" onClick={() => { setManualValuation(true); setValuationProposal(undefined); setValuationResearchMessage(""); }}>Enter manually</button><small>New research may use configured AI research credits. Reviewing existing evidence and entering it manually do not.</small></div>}
      {existingValuation && !proposed && !manualValuation && <div className="valuationExisting" role="status"><strong>Existing evidence found</strong><span>{existingValuation.valuationDate} · {marketEvidenceType(existingValuation)} · {existingValuation.confidence || "Unrated confidence"}</span><button type="button" className="textLink" onClick={() => setManualValuation(true)}>Review or update these fields →</button></div>}
      {valuationResearchMessage && <output className="valuationResearchMessage" aria-live="polite">{valuationResearchMessage}</output>}
      {proposed && <div className="valuationProposal" role="status"><div><strong>Research proposal ready</strong><span>{proposed.marketEvidenceType} · {proposed.confidence} confidence · {proposed.comparables.length} comparable{proposed.comparables.length === 1 ? "" : "s"}</span></div><p>{proposed.notes}</p><small>Review and correct the populated fields below. A source description alone never proves a completed sale.</small>{valuationRetailLead(proposed)&&<div><strong>Retailer asking-price evidence recorded</strong><small>The mobile app preserves the observation without opening a tobacco purchase page or adding affiliate tracking.</small></div>}</div>}
      {valuationFormDraft.restoredFields && <p className="deviceDraftNotice" role="status">Unfinished valuation evidence was restored from this browser profile. Review it before saving.</p>}
      {showValuationForm && <form ref={valuationFormDraft.formRef} key={`${valuationSource}-${proposed?.evidenceDate || existingValuation?.valuationDate || "manual"}`} className="recordForm" onSubmit={event => send(event, "valuation")} onChange={valuationFormDraft.capture} aria-busy={valuationMutation.pending}>
        <input type="hidden" name="inventoryId" value={valuationSource} />
        <label><span>Evidence date</span><input name="valuationDate" type="date" required defaultValue={value(proposed?.evidenceDate, existingValuation?.valuationDate) || today()} /></label>
        <label><span>Retail replacement / cigar</span><input name="replacementValue" type="number" min="0" step=".01" defaultValue={value(proposed?.replacementValue, existingValuation?.replacementValue)} /></label>
        <label><span>Market evidence type</span><select name="marketEvidenceType" defaultValue={value(proposed?.marketEvidenceType, existingValuation?.marketEvidenceType) || "Insufficient evidence"}><option>Verified completed sale</option><option>Retail consensus value</option><option>Estimated market range</option><option>Observed asking price</option><option>Insufficient evidence</option></select></label>
        <label><span>Market asking price / cigar — no confirmed sale</span><input name="askingPrice" type="number" min="0" step=".01" defaultValue={value(proposed?.askingPrice, existingValuation?.askingPrice)} /></label>
        <label><span>Asking-price source</span><input name="askingPriceSource" defaultValue={value(proposed?.askingPriceSource, existingValuation?.askingPriceSource)} placeholder="Specialty dealer or public listing" /></label>
        <label><span>Asking-price URL</span><input name="askingPriceSourceUrl" type="url" defaultValue={value(proposed?.askingPriceSourceUrl, existingValuation?.askingPriceSourceUrl)} placeholder="https://…" /></label>
        <label><span>Estimated range low / cigar</span><input name="marketRangeLow" type="number" min="0" step=".01" defaultValue={value(proposed?.marketRangeLow, existingValuation?.marketRangeLow)} /></label>
        <label><span>Estimated range high / cigar</span><input name="marketRangeHigh" type="number" min="0" step=".01" defaultValue={value(proposed?.marketRangeHigh, existingValuation?.marketRangeHigh)} /></label>
        <label><span>Estimated midpoint / cigar</span><input name="marketValue" type="number" min="0" step=".01" defaultValue={value(proposed?.marketValue, existingValuation?.marketValue)} /></label>
        <label><span>Independent comparables</span><input name="comparableCount" type="number" min="0" step="1" defaultValue={proposed ? proposed.comparables.length : existingValuation?.comparableCount ?? ""} /></label>
        <label><span>Verified completed sale / cigar</span><input name="lastSaleValue" type="number" min="0" step=".01" defaultValue={value(proposed?.lastSaleValue, existingValuation?.lastSaleValue)} /></label>
        <label><span>Completed sale date</span><input name="lastSaleDate" type="date" defaultValue={value(proposed?.lastSaleDate, existingValuation?.lastSaleDate)} /></label>
        <label><span>Auction house / venue</span><input name="lastSaleVenue" defaultValue={value(proposed?.lastSaleVenue, existingValuation?.lastSaleVenue)} placeholder="Auction house or verified seller" /></label>
        <label><span>Completed sale URL</span><input name="lastSaleSourceUrl" type="url" defaultValue={value(proposed?.lastSaleSourceUrl, existingValuation?.lastSaleSourceUrl)} placeholder="https://…" /></label>
        <label><span>Strongest evidence source</span><input name="source" defaultValue={value(proposed?.source, existingValuation?.source)} placeholder="Retailer, auction, or price guide" /></label>
        <label><span>Strongest evidence URL</span><input name="sourceUrl" type="url" defaultValue={value(proposed?.sourceUrl, existingValuation?.sourceUrl)} placeholder="https://…" /></label>
        <label><span>Confidence</span><select name="confidence" defaultValue={value(proposed?.confidence, existingValuation?.confidence) || "Low"}><option>High</option><option>Medium</option><option>Low</option></select></label>
        <label><span>Evidence notes</span><textarea name="notes" rows={3} defaultValue={value(proposed?.notes, existingValuation?.notes)} placeholder="Identity, quantity, condition, buyer premium, and comparable limitations" /></label>
        {mode === "smartsheet" && <label><span>Founder write key</span><input name="writeKey" type="password" required /></label>}
        <button className="button" disabled={valuationMutation.pending || valuationMutation.complete}>{mutationButtonText(valuationMutation.status,{idle:"Save reviewed evidence",pending:"Saving valuation…",success:"Valuation saved",error:"Retry save"})}</button>
      </form>}
      {valuationMutation.complete&&<section className="mutationCompletion" role="status" aria-live="polite" aria-labelledby="valuation-saved-title"><strong id="valuation-saved-title">Valuation evidence saved.</strong><p>Choose the next action without reloading this workspace.</p><div><button type="button" className="button" onClick={startAnotherValuation}>Add another valuation</button>{valuationSource&&<a className="button secondary" href={`/inventory/${encodeURIComponent(valuationSource)}`}>Open cigar record</a>}<a className="textLink" href="/valuations">Review valuation history</a></div></section>}
      <div className="recordList"><h3>Recent valuations</h3>{valuations.slice(0, 8).map(value => <div key={value.valuationId}><strong>{value.inventoryId}</strong><span>{value.valuationDate} · {isVerifiedCompletedSale(value) || claimsUnverifiedCompletedSale(value) ? completedSaleLabel(value) : marketEvidenceType(value)==="Observed asking price" ? marketAskingPriceLabel : marketEvidenceType(value)} · aftermarket ${value.marketValue ?? "—"} · {isVerifiedCompletedSale(value) ? `verified sale $${value.lastSaleValue}` : claimsUnverifiedCompletedSale(value) ? `legacy sale claim $${value.lastSaleValue ?? "—"}` : value.askingPrice!==undefined ? `asking $${value.askingPrice} · no confirmed sale` : "no verified sale"}</span></div>)}</div>
    </section>
    {message && <output className="wideMessage" aria-live="polite" aria-atomic="true">{message}</output>}
  </div>;
}
