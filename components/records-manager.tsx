"use client";

import { FormEvent, useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem, SmokingLog, Valuation } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const scoreOptions = Array.from({ length: 101 }, (_, index) => 100 - index);
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

  async function send(event: FormEvent<HTMLFormElement>, kind: "smoke" | "valuation") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const key = String(form.get("writeKey") || "");
    const numeric = new Set(["overall", "replacementValue", "marketValue", "lastSaleValue"]);
    const boolean = new Set(["buyAgain"]);
    const excluded = new Set(["writeKey", "flavor1", "flavor2", "flavor3"]);
    const payload: Record<string, unknown> = Object.fromEntries([...form.entries()].flatMap(([name, value]) =>
      excluded.has(name) || value === "" ? [] : [[name, numeric.has(name) ? Number(value) : boolean.has(name) ? value === "on" : value]],
    ));
    if (kind === "smoke") {
      const flavors = [...new Set(["flavor1", "flavor2", "flavor3"].map(name => String(form.get(name) || "")).filter(Boolean))];
      if (flavors.length) payload.flavor = flavors.join(", ");
    }
    const response = await fetch(kind === "smoke" ? "/api/smoking-log" : "/api/valuations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-founder-key": key },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Save failed");
      return;
    }
    if (kind === "smoke") setSmokes(values => [result.data, ...values]);
    else setValuations(values => [result.data, ...values]);
    setMessage(kind === "smoke" && smokeSource === "MANUAL" ? "Smoking experience saved. Inventory was not changed." : "Saved.");
    event.currentTarget.reset();
    if (kind === "smoke") setSmokeSource("");
  }

  const valuationPicker = <select name="inventoryId" required defaultValue={selectedInventoryId || ""}>
    <option value="">Select inventory lot</option>
    {inventory.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}</option>)}
  </select>;

  return <div className="recordsGrid">
    <section className="card smokeJournal" id="log-smoke">
      <div className="eyebrow">Private tasting journal</div>
      <h2>Log a smoke</h2>
      <p className="small">Record what you experienced in your own words. There are no wrong tasting notes.</p>
      <form className="recordForm" onSubmit={event => send(event, "smoke")}>
        <label><span>Smoke ID</span><input name="smokeId" required placeholder="SMK-0001" /></label>
        <label><span>Inventory lot or another cigar *</span><select name="inventoryId" required value={smokeSource} onChange={event => setSmokeSource(event.target.value)}>
          <option value="">Select from your inventory</option>
          {inventory.map(item => <option key={item.inventoryId} value={item.inventoryId}>{item.inventoryId} · {item.brand} {item.line} · {item.vitola}</option>)}
          <option value="MANUAL">Another cigar — enter manually</option>
        </select></label>
        {smokeSource === "MANUAL" && <label className="manualSmokeCigar"><span>Cigar name *</span><input name="cigarName" required minLength={3} maxLength={300} placeholder="Brand, line, vitola, and year if known" /><small>This records the experience without reducing inventory.</small></label>}
        <label><span>Date</span><input name="dateSmoked" type="date" required defaultValue={today()} /></label>
        <label><span>Score · 0–100</span><select name="overall" defaultValue=""><option value="">Choose a score</option>{scoreOptions.map(score => <option value={score} key={score}>{score}</option>)}</select></label>
        <label><span>Strength</span><select name="strength" defaultValue=""><option value="">Choose perceived strength</option>{strengthOptions.map(value => <option key={value}>{value}</option>)}</select><small>How the nicotine intensity felt—not the depth of flavor.</small></label>
        <fieldset className="flavorChoices"><legend>Flavor notes · choose up to 3</legend>{[1, 2, 3].map(index => <label key={index}><span>Flavor {index}</span><select name={`flavor${index}`} defaultValue=""><option value="">{index === 1 ? "Choose a primary note" : "Optional"}</option>{flavorOptions.map(value => <option key={value}>{value}</option>)}</select></label>)}<small>Choose broad impressions. Add anything more specific in your tasting notes.</small></fieldset>
        <label><span>Tasting notes</span><textarea name="tastingNotes" rows={4} placeholder="How did it begin, develop, and finish? What stood out?" /></label>
        <label className="check"><input name="buyAgain" type="checkbox" /> Buy again</label>
        {mode === "smartsheet" && <label><span>Founder write key</span><input name="writeKey" type="password" required /></label>}
        <button className="button" disabled={mode === "mock"}>Save smoke</button>
      </form>
      <div className="recordList"><h3>Recent smokes</h3>{smokes.slice(0, 8).map(smoke => <div key={smoke.smokeId}><strong>{smoke.cigarName || smoke.inventoryId}</strong><span>{smoke.dateSmoked} · {smoke.overall ?? "—"}</span></div>)}</div>
    </section>

    <section className="card"><h2>Add a valuation</h2><p className="small">Enter retail replacement and aftermarket values per cigar. Record a completed auction separately as the last known sale.</p><form className="recordForm" onSubmit={event => send(event, "valuation")}><label><span>Valuation ID</span><input name="valuationId" required placeholder="VAL-0001" /></label><label><span>Inventory lot</span>{valuationPicker}</label><label><span>Evidence date</span><input name="valuationDate" type="date" required defaultValue={today()} /></label><label><span>Retail replacement / cigar</span><input name="replacementValue" type="number" min="0" step=".01" /></label><label><span>Aftermarket value / cigar</span><input name="marketValue" type="number" min="0" step=".01" /></label><label><span>Last known sale / cigar</span><input name="lastSaleValue" type="number" min="0" step=".01" /></label><label><span>Completed sale date</span><input name="lastSaleDate" type="date" /></label><label><span>Auction house / venue</span><input name="lastSaleVenue" placeholder="European auction house or verified seller" /></label><label><span>Completed sale URL</span><input name="lastSaleSourceUrl" type="url" placeholder="https://…" /></label><label><span>Source name</span><input name="source" placeholder="Retailer, auction, or price guide" /></label><label><span>Source URL</span><input name="sourceUrl" type="url" placeholder="https://…" /></label><label><span>Confidence</span><select name="confidence"><option>High</option><option>Medium</option><option>Low</option></select></label><label><span>Evidence notes</span><textarea name="notes" rows={3} placeholder="Box size, condition, buyer premium, vintage, or comparable details" /></label>{mode === "smartsheet" && <label><span>Founder write key</span><input name="writeKey" type="password" required /></label>}<button className="button" disabled={mode === "mock"}>Save valuation</button></form><div className="recordList"><h3>Recent valuations</h3>{valuations.slice(0, 8).map(value => <div key={value.valuationId}><strong>{value.inventoryId}</strong><span>{value.valuationDate} · aftermarket ${value.marketValue ?? "—"} · last sale ${value.lastSaleValue ?? "—"}</span></div>)}</div></section>
    {message && <output className="wideMessage">{message}</output>}
  </div>;
}
