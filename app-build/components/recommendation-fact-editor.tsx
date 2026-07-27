"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { InventoryItem } from "@/lib/types";

type RequiredInventoryFact = "vintage" | "actualCost" | "provenanceNotes" | "storageLocationId";

const factCopy: Record<RequiredInventoryFact, {
  label: string;
  action: string;
  help: string;
  kind: "year" | "money" | "text" | "choice";
}> = {
  vintage: {
    label: "Production or release year",
    action: "Add production or release year",
    help: "Enter the documented year for this exact lot. Leave it blank if the year is not verified.",
    kind: "year",
  },
  actualCost: {
    label: "Purchase price per cigar",
    action: "Add purchase price",
    help: "Enter your documented per-cigar cost. This remains private and is not treated as market evidence.",
    kind: "money",
  },
  provenanceNotes: {
    label: "Provenance note",
    action: "Add its story",
    help: "Record the acquisition, person, place, or occasion you can personally verify.",
    kind: "text",
  },
  storageLocationId: {
    label: "Storage location",
    action: "Assign storage",
    help: "Choose the humidor that currently holds this exact lot.",
    kind: "choice",
  },
};

export function RecommendationFactEditor({
  item,
  fact,
  choices = [],
}: {
  item: InventoryItem;
  fact: RequiredInventoryFact;
  choices?: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const copy = factCopy[fact];
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const rawValue = String(form.get(fact) || "").trim();
    const value = fact === "actualCost" ? Number(rawValue) : rawValue;
    if (!rawValue || (fact === "actualCost" && (!Number.isFinite(value) || Number(value) < 0))) {
      setError(`Enter the verified ${copy.label.toLowerCase()}.`);
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, [fact]: value }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Could not save ${copy.label.toLowerCase()}.`);
      setMessage(`${copy.label} saved. Cedriva has refreshed this recommendation.`);
      setEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Could not save ${copy.label.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="recommendationFactEditor">
      {!editing ? (
        <button className="button secondary" type="button" onClick={() => {
          setEditing(true);
          setError("");
          setMessage("");
        }}>
          {copy.action}
        </button>
      ) : (
        <form onSubmit={save}>
          <label>
            <span>{copy.label}</span>
            {copy.kind === "text" ? (
              <textarea name={fact} rows={3} defaultValue={String(item[fact] ?? "")} autoFocus required />
            ) : copy.kind === "choice" ? (
              <select name={fact} defaultValue={String(item[fact] ?? "")} autoFocus required>
                <option value="">Choose a documented location</option>
                {choices.map(choice => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
              </select>
            ) : (
              <input
                name={fact}
                type="number"
                inputMode={copy.kind === "year" ? "numeric" : "decimal"}
                min={copy.kind === "year" ? "1800" : "0"}
                max={copy.kind === "year" ? new Date().getFullYear() : undefined}
                step={copy.kind === "money" ? "0.01" : "1"}
                defaultValue={String(item[fact] ?? "")}
                autoFocus
                required
              />
            )}
          </label>
          <small>{copy.help}</small>
          <div className="ctaRow">
            <button className="button" disabled={busy}>{busy ? "Saving…" : "Save and refresh"}</button>
            <button className="button secondary" type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
      {message && <output className="successMessage" aria-live="polite">{message}</output>}
      {error && <output className="errorMessage" aria-live="assertive">{error}</output>}
    </div>
  );
}
