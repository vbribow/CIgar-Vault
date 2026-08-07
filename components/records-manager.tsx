"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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

const today = () => new Date().toISOString().slice(0, 10);const scoreOptions = Array.from({ length: 101 }, (_, index) => 100 - index);
function smokeSaveMessage(result: { collector25?: { status?: string } }, manual: boolean) {
  if (manual) return "Smoking experience saved to your private journal. Inventory was not changed, and manual entries are not shared with the Hojavía 25.";
  if (result.collector25?.status === "contributed") return "Smoking experience saved to your private journal. Your anonymous score updated the Hojavía 25.";
  if (result.collector25?.status === "disabled") return "Smoking experience saved to your private journal. Anonymous Hojavía 25 sharing is off in Account preferences.";
  if (result.collector25?.status === "ineligible") return "Smoking experience saved to your private journal. An exact Vault identity and a 1–100 score are required for the Hojavía 25.";
  if (result.collector25?.status === "unavailable") return "Smoking experience saved safely to your private journal. The Hojavía 25 could not update right now.";
  return "Smoking experience saved to your private journal.";
}
export const strengthOptions = ["Mild", "Mild–medium", "Medium", "Medium–full", "Full"] as const;
export const flavorOptions = ["Cedar", "Earth", "Leather", "Pepper", "Cream", "Coffee", "Cocoa / chocolate", "Nuts", "Sweetness", "Baking spice", "Fruit", "Floral", "Toast", "Mineral", "Other"] as const;

export function RecordsManager({ inventory, initialSmokes, initialValuations, mode, selectedInventoryId }: {
  inventory: InventoryItem[];
  initialSmokes: SmokingLog[];
  initialValuations: Valuation[];
  mode: DataMode;
  selectedInventoryId?: string;
}) {
  const [smokes, setSmokes] = useState(initialSmokes);
  const [valuations, setValuations] = useState(initialValuations);
  const [message, setMessage] = useState("");
  const [smokeSource, setSmokeSource] = useState(selectedInventoryId || "");
  const [smokeCigarName, setSmokeCigarName] = useState("");
  const [smokePhotos, setSmokePhotos] = useState<File[]>([]);
  const [smokePhotoAnalysis, setSmokePhotoAnalysis] = useState<CigarVisionResult>();
  const [smokePhotoBusy, setSmokePhotoBusy] = useState(false);
  const [smokePhotoMessage, setSmokePhotoMessage] = useState("");
  const [smokeSubmissionId, setSmokeSubmissionId] = useState(createClientUuid);
  const [valuationSubmissionId, setValuationSubmissionId] = useState(createClientUuid);
  const [valuationSource, setValuationSource] = useState(selectedInventoryId || "");
  const [valuationProposal, setValuationProposal] = useState<ValuationResearch>();
  const [valuationResearching, setValuationResearching] = useState(false);
  const [valuationResearchMessage, setValuationResearchMessage] = useState("");
  const [valuationRetailOpening,setValuationRetailOpening]=useState(false);
  const [manualValuation, setManualValuation] = useState(false);
  const [newSmokeConfirmed, setNewSmokeConfirmed] = useState(false);
  const smokeMutation = useMutationGuard();
  const valuationMutation = useMutationGuard();
  const recordSafety = useUnsavedChanges();
  const smokeDraft = useDeviceFormDraft("hojavia:form-draft:smoke:v1");
  const valuationFormDraft = useDeviceFormDraft("hojavia:form-draft:valuation:v1");

  useEffect(() => {
    const restoredSource = smokeDraft.restoredFields?.inventoryId?.[0];
    if (restoredSource) setSmokeSource(restoredSource);
    const restoredName = smokeDraft.restoredFields?.cigarName?.[0];
    if (restoredName) setSmokeCigarName(restoredName);
  }, [smokeDraft.restoredFields]);

  async function send(event: FormEvent<HTMLFormElement>, kind: "smoke" | "valuation") {
    event.preventDefault();
    const mutation = kind === "smoke" ? smokeMutation : valuationMutation;
    if (!mutation.begin()) return;
    const form = new FormData(event.currentTarget);
    const key = String(form.get("writeKey") || "");
    const numeric = new Set(["overall", "replacementValue", "marketValue", "marketRangeLow", "marketRangeHigh", "askingPrice", "comparableCount", "lastSaleValue"]);
    const boolean = new Set(["buyAgain"]);
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
    let failureStatus=0;
    try {
      const response = await fetch(kind === "smoke" ? "/api/smoking-log" : "/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-founder-key": key },
        body: JSON.stringify(payload),
      });
      failureStatus=response.status;
      const result = await readSaveResponse(response);
      if (!response.ok) throw new Error(result.error || "Save failed");
      if (kind === "smoke") {
        void captureOperationalSuccess("smoke-save",response.status);
        setSmokes(values => values.some(value => value.smokeId === result.data.smokeId) ? values : [result.data, ...values]);
        setSmokeSubmissionId(createClientUuid());
      }
      else {
        setValuations(values => values.some(value => value.valuationId === result.data.valuationId) ? values : [result.data, ...values]);
        setValuationSubmissionId(createClientUuid());
      }
      setMessage(kind === "smoke" ? smokeSaveMessage(result, smokeSource === "MANUAL") : "Valuation evidence saved to your private Vault.");
      mutation.succeed();
      event.currentTarget.reset();
      if (kind === "smoke") smokeDraft.clear(); else valuationFormDraft.clear();
      recordSafety.markSaved();
      if (kind === "smoke") { setSmokeSource(selectedInventoryId || ""); setSmokeCigarName(""); setSmokePhotos([]); setSmokePhotoAnalysis(undefined); setSmokePhotoMessage(""); }
    } catch (error) {
      if(kind==="smoke")void captureOperationalFailure("smoke-save",failureStatus);
      mutation.fail();
      setMessage(saveRecoveryMessage(error, kind === "smoke" ? "this smoking experience" : "this valuation evidence"));
    }
  }

  function startAnotherSmoke() {
    smokeMutation.reset();
    setNewSmokeConfirmed(true);
    setSmokeSubmissionId(createClientUuid());
    setSmokeSource(selectedInventoryId || "");
    setSmokeCigarName("");
    setSmokePhotos([]);
    setSmokePhotoAnalysis(undefined);
    setSmokePhotoMessage("");
    setMessage("");
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
    } finally { URL.revokeObjectURL(source); }
  }

  async function identifySmokePhotos() {
    if (!smokePhotos.length || smokePhotoBusy) return;
    setSmokePhotoBusy(true); setSmokePhotoMessage("");
    try {
      const form = new FormData();
      for (const file of smokePhotos) form.append("photos", await prepareSmokePhoto(file));
      const response = await fetch("/api/photo-identification", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Photo identification failed");
      const analysis = result.data as CigarVisionResult;
      const identity = [analysis.brand, analysis.line, analysis.vitola, analysis.vintage].filter(Boolean).join(" ");
      setSmokePhotoAnalysis(analysis); setSmokeCigarName(identity);
      setSmokePhotoMessage(`Identification ready (${analysis.confidence} confidence). Confirm or correct the cigar before saving your review.`);
    } catch (error) { setSmokePhotoMessage(error instanceof Error ? error.message : "Photo identification failed"); }
    finally { setSmokePhotoBusy(false); }
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

  async function openValuationRetailer(){
    if(!valuationProposal||valuationRetailOpening)return;
    const listing=valuationRetailLead(valuationProposal);if(!listing)return;
    setValuationRetailOpening(true);setValuationResearchMessage("");
    try{
      const response=await fetch("/api/retailer-market/click",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({inventoryId:valuationSource,listing})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"Retailer link is unavailable");
      window.open(result.data.outboundUrl,"_blank","noopener,noreferrer");
      setValuationResearchMessage(result.message||"Retailer opened. Price and availability are not confirmed until the seller verifies them.");
    }catch(error){setValuationResearchMessage(error instanceof Error?error.message:"Retailer link is unavailable")}
    finally{setValuationRetailOpening(false)}
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
      <div className="smokeStartChoices" aria-label="Choose how to log this cigar">
        <button type="button" className={smokeSource === "MANUAL" ? "active" : ""} onClick={() => { setSmokeSource("MANUAL"); setSmokePhotoMessage(""); }}><strong>Log a review only</strong><small>Identify by photo or type the cigar. Nothing is added to inventory.</small></button>
        <button type="button" className={smokeSource && smokeSource !== "MANUAL" ? "active" : ""} onClick={() => { setSmokeSource(selectedInventoryId || ""); setSmokePhotoMessage(""); document.querySelector<HTMLSelectElement>('#smoke-inventory-source')?.focus(); }}><strong>Log from my Vault</strong><small>Connect the review to an owned lot and reduce that lot by one.</small></button>
        <a href="/inventory#mobile-intake"><strong>Add to Vault first</strong><small>Create and verify the inventory lot before logging its smoke.</small></a>
      </div>
      {smokeDraft.restoredFields && <p className="deviceDraftNotice" role="status">Unfinished tasting details were restored from this browser profile. Review them before saving.</p>}
      <form ref={smokeDraft.formRef} className="recordForm" onSubmit={event => send(event, "smoke")} onChange={smokeDraft.capture} aria-busy={smokeMutation.pending}>
        <fieldset disabled={smokeMutation.pending || smokeMutation.complete}>
        <label><span>Inventory lot or another cigar *</span><select id="smoke-inventory-source" name="inventoryId" required value={smokeSource} onChange={event => { setSmokeSource(event.target.value); setSmokePhotoMessage(""); }}>
          <option value="">Choose how to identify this cigar</option>
          <option value="MANUAL">Another smoke — not in my Vault</option>
          {inventory.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}</option>)}
        </select></label>
        {smokeSource === "MANUAL" && <div className="manualSmokeIdentity">
          <div className="smokePhotoIdentify"><div><strong>Identify by photo</strong><small>Photograph the cigar or band. Hojavía proposes an identity; you approve or correct it. Identification may use configured AI credits.</small></div><label className="cameraCapture"><input type="file" accept="image/*" capture="environment" onChange={chooseSmokePhotos}/><span>Take a photo</span></label><label className="photoDrop compact"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseSmokePhotos}/><span>Choose photos</span></label><button type="button" className="button secondary" disabled={!smokePhotos.length || smokePhotoBusy} onClick={identifySmokePhotos}>{smokePhotoBusy ? "Identifying…" : "Identify cigar"}</button></div>
          {smokePhotoMessage && <output className="smokePhotoMessage" aria-live="polite">{smokePhotoMessage}</output>}
          {smokePhotoAnalysis && <div className={`visionEvidence confidence-${smokePhotoAnalysis.confidence}`}><strong>{smokePhotoAnalysis.confidence} confidence · review required</strong><p>{smokePhotoAnalysis.evidenceSummary}</p>{smokePhotoAnalysis.uncertainties.length > 0 && <small><b>Confirm:</b> {smokePhotoAnalysis.uncertainties.join(" · ")}</small>}</div>}
          <label className="manualSmokeCigar"><span>What did you smoke? *</span><input name="cigarName" required minLength={3} maxLength={300} value={smokeCigarName} onChange={event => setSmokeCigarName(event.target.value)} placeholder="Brand, line, exact vitola, and year if known" /><small>Review and correct photo suggestions. Saving creates only a private smoking review—no Vault record and no quantity change.</small></label>
        </div>}
        <label><span>Date</span><input name="dateSmoked" type="date" required defaultValue={today()} /></label>
        <label><span>Score · 0–100</span><select name="overall" defaultValue=""><option value="">Choose a score</option>{scoreOptions.map(score => <option value={score} key={score}>{score}</option>)}</select><small>With anonymous Collector 25 sharing enabled in <a href="/account#collector-25-preference">Account preferences</a>, an exact Vault cigar and 1–100 score update your one current contribution. Notes and inventory stay private.</small></label>
        <label><span>Strength</span><select name="strength" defaultValue=""><option value="">Choose perceived strength</option>{strengthOptions.map(value => <option key={value}>{value}</option>)}</select><small>How the nicotine intensity felt—not the depth of flavor.</small></label>
        <label><span>Construction Quality</span><select name="construction" defaultValue=""><option value="">Optional</option>{constructionQualityOptions.map(value => <option key={value}>{value}</option>)}</select><small>How well the cigar was physically made—not its flavor or strength.</small></label>
        <label><span>Burn</span><select name="burn" defaultValue=""><option value="">Optional</option>{burnQualityOptions.map(value => <option key={value}>{value}</option>)}</select><small>How evenly the cigar burned and whether it needed correction.</small></label>
        <fieldset className="flavorChoices"><legend>Flavor notes · choose up to 3</legend>{[1, 2, 3].map(index => <label key={index}><span>Flavor {index}</span><select name={`flavor${index}`} defaultValue=""><option value="">{index === 1 ? "Choose a primary note" : "Optional"}</option>{flavorOptions.map(value => <option key={value}>{value}</option>)}</select></label>)}<small>Choose broad impressions. Add anything more specific in your tasting notes.</small></fieldset>
        <label><span>Tasting notes</span><textarea name="tastingNotes" rows={4} placeholder="How did it begin, develop, and finish? What stood out?" /></label>
        <label className="check"><input name="buyAgain" type="checkbox" /> Buy again</label>
        {mode === "smartsheet" && <label><span>Founder write key</span><input name="writeKey" type="password" required /></label>}
        <button className="button" disabled={mode === "mock" || smokeMutation.pending || smokeMutation.complete}>{mutationButtonText(smokeMutation.status,{idle:"Save smoke",pending:"Saving smoke…",success:"Smoke saved",error:"Retry save"})}</button>
        </fieldset>
      </form>
      {smokeMutation.complete && <button type="button" className="button secondary" onClick={startAnotherSmoke}>Log another</button>}
      <div className="recordList" id="smoking-history"><div className="recordListHeader"><h3>Recent smokes</h3><a className="textLink" href="/smoke-journal">View and search every smoke →</a></div>{smokes.slice(0, 8).map(smoke => <div id={`smoke-${smoke.smokeId}`} key={smoke.smokeId}><strong>{smoke.cigarName || smoke.inventoryId}</strong><span>Entry #{smokeEntryOrder(smokes, smoke.smokeId)} · {smoke.dateSmoked} · {smoke.overall ?? "—"}</span></div>)}</div>
    </section>

    <section className="card valuationIntake">
      <div><div className="eyebrow">Evidence-led valuation</div><h2>Add valuation evidence</h2><p className="small">Choose the cigar first. Hojavía can reuse its latest saved evidence at no research cost, or prepare new source-backed proposals for your review. Nothing is saved until you approve the form.</p></div>
      <label><span>Inventory lot</span>{valuationPicker}</label>
      {valuationSource && <div className="valuationIntakeActions"><button type="button" className="button" onClick={researchValuation} disabled={valuationResearching}>{valuationResearching ? "Researching exact evidence…" : "Research this cigar"}</button><button type="button" className="button secondary" onClick={() => { setManualValuation(true); setValuationProposal(undefined); setValuationResearchMessage(""); }}>Enter manually</button><small>New research may use configured AI research credits. Reviewing existing evidence and entering it manually do not.</small></div>}
      {existingValuation && !proposed && !manualValuation && <div className="valuationExisting" role="status"><strong>Existing evidence found</strong><span>{existingValuation.valuationDate} · {marketEvidenceType(existingValuation)} · {existingValuation.confidence || "Unrated confidence"}</span><button type="button" className="textLink" onClick={() => setManualValuation(true)}>Review or update these fields →</button></div>}
      {valuationResearchMessage && <output className="valuationResearchMessage" aria-live="polite">{valuationResearchMessage}</output>}
      {proposed && <div className="valuationProposal" role="status"><div><strong>Research proposal ready</strong><span>{proposed.marketEvidenceType} · {proposed.confidence} confidence · {proposed.comparables.length} comparable{proposed.comparables.length === 1 ? "" : "s"}</span></div><p>{proposed.notes}</p><small>Review and correct the populated fields below. A source description alone never proves a completed sale.</small>{valuationRetailLead(proposed)&&<div><button type="button" className="button secondary" disabled={valuationRetailOpening} onClick={openValuationRetailer}>{valuationRetailOpening?"Opening retailer…":"Buy this cigar ↗"}</button><small>Direct retailer listing from this research · asking price and availability are not a confirmed sale.</small></div>}</div>}
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
      {valuationMutation.complete&&<button type="button" className="button secondary" onClick={startAnotherValuation}>Add another valuation</button>}
      <div className="recordList"><h3>Recent valuations</h3>{valuations.slice(0, 8).map(value => <div key={value.valuationId}><strong>{value.inventoryId}</strong><span>{value.valuationDate} · {isVerifiedCompletedSale(value) || claimsUnverifiedCompletedSale(value) ? completedSaleLabel(value) : marketEvidenceType(value)==="Observed asking price" ? marketAskingPriceLabel : marketEvidenceType(value)} · aftermarket ${value.marketValue ?? "—"} · {isVerifiedCompletedSale(value) ? `verified sale $${value.lastSaleValue}` : claimsUnverifiedCompletedSale(value) ? `legacy sale claim $${value.lastSaleValue ?? "—"}` : value.askingPrice!==undefined ? `asking $${value.askingPrice} · no confirmed sale` : "no verified sale"}</span></div>)}</div>
    </section>
    {message && <output className="wideMessage" aria-live="polite" aria-atomic="true">{message}</output>}
  </div>;
}
