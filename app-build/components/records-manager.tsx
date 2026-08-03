"use client";

import { FormEvent, useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem, SmokingLog, Valuation } from "@/lib/types";
import { smokeEntryOrder } from "@/lib/smoke-journal";
import { mutationButtonText } from "@/lib/mutation-state";
import { useMutationGuard } from "@/components/use-mutation-guard";
import { claimsUnverifiedCompletedSale, completedSaleLabel, isVerifiedCompletedSale, marketAskingPriceLabel, marketEvidenceType } from "@/lib/valuation-evidence";
import { burnQualityOptions, constructionQualityOptions } from "@/lib/records-model";
import { captureOperationalFailure, captureOperationalSuccess } from "@/lib/operational-failure";
import type { ValuationResearch } from "@/lib/valuation-research";

const today = () => new Date().toISOString().slice(0, 10);const scoreOptions = Array.from({ length: 101 }, (_, index) => 100 - index);
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
  const [smokeSubmissionId, setSmokeSubmissionId] = useState(() => crypto.randomUUID());
  const [valuationSubmissionId, setValuationSubmissionId] = useState(() => crypto.randomUUID());
  const [valuationSource, setValuationSource] = useState(selectedInventoryId || "");
  const [valuationDraft, setValuationDraft] = useState<ValuationResearch>();
  const [valuationResearching, setValuationResearching] = useState(false);
  const [valuationResearchMessage, setValuationResearchMessage] = useState("");
  const [manualValuation, setManualValuation] = useState(false);
  const [newSmokeConfirmed, setNewSmokeConfirmed] = useState(false);
  const smokeMutation = useMutationGuard();
  const valuationMutation = useMutationGuard();

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
    const response = await fetch(kind === "smoke" ? "/api/smoking-log" : "/api/valuations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-founder-key": key },
      body: JSON.stringify(payload),
    }).catch(error => {
      if(kind==="smoke")void captureOperationalFailure("smoke-save");
      mutation.fail();
      setMessage(error instanceof Error ? error.message : "Save failed");
      return undefined;
    });
    if (!response) return;
    const result = await response.json();
    if (!response.ok) {
      if(kind==="smoke")void captureOperationalFailure("smoke-save",response.status);
      setMessage(result.error || "Save failed");
      mutation.fail();
      return;
    }
    if(kind==="smoke")void captureOperationalSuccess("smoke-save",response.status);
    if (kind === "smoke") {
      setSmokes(values => values.some(value => value.smokeId === result.data.smokeId) ? values : [result.data, ...values]);
      setSmokeSubmissionId(crypto.randomUUID());
    }
    else {
      setValuations(values => values.some(value => value.valuationId === result.data.valuationId) ? values : [result.data, ...values]);
      setValuationSubmissionId(crypto.randomUUID());
    }
    setMessage(kind === "smoke" && smokeSource === "MANUAL" ? "Smoking experience saved. Inventory was not changed." : "Saved.");
    mutation.succeed();
    event.currentTarget.reset();
    if (kind === "smoke") setSmokeSource(selectedInventoryId || "");
  }

  function startAnotherSmoke() {
    smokeMutation.reset();
    setNewSmokeConfirmed(true);
    setSmokeSubmissionId(crypto.randomUUID());
    setSmokeSource(selectedInventoryId || "");
    setMessage("");
  }

  function startAnotherValuation() {
    valuationMutation.reset();
    setValuationSubmissionId(crypto.randomUUID());
    setMessage("");
    setValuationDraft(undefined);
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
      setValuationDraft(result.data);
      setManualValuation(false);
      setValuationResearchMessage("Research complete. Review every proposed field before saving.");
    } catch (error) {
      setValuationResearchMessage(error instanceof Error ? error.message : "Valuation research could not be completed");
    } finally {
      setValuationResearching(false);
    }
  }

  const valuationPicker = <select name="inventoryId" required value={valuationSource} onChange={event => { setValuationSource(event.target.value); setValuationDraft(undefined); setManualValuation(false); setValuationResearchMessage(""); }}>
    <option value="">Select inventory lot</option>
    {inventory.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}</option>)}
  </select>;
  const existingValuation = valuations.find(value => value.inventoryId === valuationSource);
  const proposed = valuationDraft;
  const showValuationForm = Boolean(proposed || manualValuation || existingValuation);
  const value = <T,>(researched: T | null | undefined, existing: T | undefined) => researched ?? existing ?? "";

  return <div className="recordsGrid">
    <section className="card smokeJournal" id="log-smoke">
      <div className="eyebrow">Private tasting journal</div>
      <h2>Log a smoke</h2>
      <p className="small">Record what you experienced in your own words. There are no wrong tasting notes.</p>
      <form className="recordForm" onSubmit={event => send(event, "smoke")} aria-busy={smokeMutation.pending}>
        <fieldset disabled={smokeMutation.pending || smokeMutation.complete}>
        <label><span>Inventory lot or another cigar *</span><select name="inventoryId" required value={smokeSource} onChange={event => setSmokeSource(event.target.value)}>
          <option value="">Select from your inventory</option>
          {inventory.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}</option>)}
          <option value="MANUAL">Another cigar — enter manually</option>
        </select></label>
        {smokeSource === "MANUAL" && <label className="manualSmokeCigar"><span>Cigar name *</span><input name="cigarName" required minLength={3} maxLength={300} placeholder="Brand, line, vitola, and year if known" /><small>This records the experience without reducing inventory.</small></label>}
        <label><span>Date</span><input name="dateSmoked" type="date" required defaultValue={today()} /></label>
        <label><span>Score · 0–100</span><select name="overall" defaultValue=""><option value="">Choose a score</option>{scoreOptions.map(score => <option value={score} key={score}>{score}</option>)}</select></label>
        <label><span>Strength</span><select name="strength" defaultValue=""><option value="">Choose perceived strength</option>{strengthOptions.map(value => <option key={value}>{value}</option>)}</select><small>How the nicotine intensity felt—not the depth of flavor.</small></label>
        <label><span>Construction Quality</span><select name="construction" defaultValue=""><option value="">Optional</option>{constructionQualityOptions.map(value => <option key={value}>{value}</option>)}</select><small>How well the cigar was physically made—not its flavor or strength.</small></label>
        <label><span>Burn</span><select name="burn" defaultValue=""><option value="">Optional</option>{burnQualityOptions.map(value => <option key={value}>{value}</option>)}</select><small>How evenly the cigar burned and whether it needed correction.</small></label>
        <fieldset className="flavorChoices"><legend>Flavor notes · choose up to 3</legend>{[1, 2, 3].map(index => <label key={index}><span>Flavor {index}</span><select name={`flavor${index}`} defaultValue=""><option value="">{index === 1 ? "Choose a primary note" : "Optional"}</option>{flavorOptions.map(value => <option key={value}>{value}</option>)}</select></label>)}<small>Choose broad impressions. Add anything more specific in your tasting notes.</small></fieldset>
        <label><span>Tasting notes</span><textarea name="tastingNotes" rows={4} placeholder="How did it begin, develop, and finish? What stood out?" /></label>
        <label className="check"><input name="buyAgain" type="checkbox" /> Buy again</label>
        {mode === "smartsheet" && <label><span>Founder write key</span><input name="writeKey" type="password" required /></label>}
        <button className="button" disabled={mode === "mock" || smokeMutation.pending || smokeMutation.complete}>{mutationButtonText(smokeMutation.status,{idle:"Save smoke",pending:"Saving smoke…",success:"Smoke saved"})}</button>
        </fieldset>
      </form>
      {smokeMutation.complete && <button type="button" className="button secondary" onClick={startAnotherSmoke}>Log another</button>}
      <div className="recordList" id="smoking-history"><h3>Recent smokes</h3>{smokes.slice(0, 8).map(smoke => <div id={`smoke-${smoke.smokeId}`} key={smoke.smokeId}><strong>{smoke.cigarName || smoke.inventoryId}</strong><span>Entry #{smokeEntryOrder(smokes, smoke.smokeId)} · {smoke.dateSmoked} · {smoke.overall ?? "—"}</span></div>)}</div>
    </section>

    <section className="card valuationIntake">
      <div><div className="eyebrow">Evidence-led valuation</div><h2>Add valuation evidence</h2><p className="small">Choose the cigar first. Hojavía can reuse its latest saved evidence at no research cost, or prepare new source-backed proposals for your review. Nothing is saved until you approve the form.</p></div>
      <label><span>Inventory lot</span>{valuationPicker}</label>
      {valuationSource && <div className="valuationIntakeActions">
        <button type="button" className="button" onClick={researchValuation} disabled={valuationResearching}>{valuationResearching ? "Researching exact evidence…" : "Research this cigar"}</button>
        <button type="button" className="button secondary" onClick={() => { setManualValuation(true); setValuationDraft(undefined); setValuationResearchMessage(""); }}>Enter manually</button>
        <small>New research may use configured AI research credits. Reviewing existing evidence and entering it manually do not.</small>
      </div>}
      {existingValuation && !proposed && !manualValuation && <div className="valuationExisting" role="status"><strong>Existing evidence found</strong><span>{existingValuation.valuationDate} · {marketEvidenceType(existingValuation)} · {existingValuation.confidence || "Unrated confidence"}</span><button type="button" className="textLink" onClick={() => setManualValuation(true)}>Review or update these fields →</button></div>}
      {valuationResearchMessage && <output className="valuationResearchMessage" aria-live="polite">{valuationResearchMessage}</output>}
      {proposed && <div className="valuationProposal" role="status"><div><strong>Research proposal ready</strong><span>{proposed.marketEvidenceType} · {proposed.confidence} confidence · {proposed.comparables.length} comparable{proposed.comparables.length === 1 ? "" : "s"}</span></div><p>{proposed.notes}</p><small>Review and correct the populated fields below. A source description alone never proves a completed sale.</small></div>}
      {showValuationForm && <form key={`${valuationSource}-${proposed?.evidenceDate || existingValuation?.valuationDate || "manual"}`} className="recordForm" onSubmit={event => send(event, "valuation")} aria-busy={valuationMutation.pending}>
        <input type="hidden" name="inventoryId" value={valuationSource} />
        <label><span>Evidence date</span><input name="valuationDate" type="date" required defaultValue={value(proposed?.evidenceDate, existingValuation?.valuationDate) || today()} /></label>
        <label><span>Retail replacement / cigar</span><input name="replacementValue" type="number" min="0" step=".01" defaultValue={value(proposed?.replacementValue, existingValuation?.replacementValue)} /></label>
        <label><span>Market evidence type</span><select name="marketEvidenceType" defaultValue={value(proposed?.marketEvidenceType, existingValuation?.marketEvidenceType) || "Insufficient evidence"}><option>Verified completed sale</option><option>Estimated market range</option><option>Observed asking price</option><option>Insufficient evidence</option></select></label>
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
        <button className="button" disabled={valuationMutation.pending || valuationMutation.complete}>{mutationButtonText(valuationMutation.status,{idle:"Save reviewed evidence",pending:"Saving valuation…",success:"Valuation saved"})}</button>
      </form>}
      {valuationMutation.complete&&<button type="button" className="button secondary" onClick={startAnotherValuation}>Add another valuation</button>}
      <div className="recordList"><h3>Recent valuations</h3>{valuations.slice(0, 8).map(value => <div key={value.valuationId}><strong>{value.inventoryId}</strong><span>{value.valuationDate} · {isVerifiedCompletedSale(value) || claimsUnverifiedCompletedSale(value) ? completedSaleLabel(value) : marketEvidenceType(value)==="Observed asking price" ? marketAskingPriceLabel : marketEvidenceType(value)} · aftermarket ${value.marketValue ?? "—"} · {isVerifiedCompletedSale(value) ? `verified sale $${value.lastSaleValue}` : claimsUnverifiedCompletedSale(value) ? `legacy sale claim $${value.lastSaleValue ?? "—"}` : value.askingPrice!==undefined ? `asking $${value.askingPrice} · no confirmed sale` : "no verified sale"}</span></div>)}</div>
    </section>
    {message && <output className="wideMessage" aria-live="polite" aria-atomic="true">{message}</output>}
  </div>;
}
