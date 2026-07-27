"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { InventoryItem } from "@/lib/types";

type RequiredInventoryFact = "vintage";

const factCopy: Record<RequiredInventoryFact, {
  label: string;
  action: string;
  help: string;
}> = {
  vintage: {
    label: "Production or release year",
    action: "Add production or release year",
    help: "Enter the documented year for this exact lot. Leave it blank if the year is not verified.",
  },
};

export function RecommendationFactEditor({
  item,
  fact,
}: {
  item: InventoryItem;
  fact: RequiredInventoryFact;
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
    const value = String(form.get(fact) || "").trim();
    if (!value) {
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
            <input
              name={fact}
              type="number"
              inputMode="numeric"
              min="1800"
              max={new Date().getFullYear()}
              defaultValue={item.vintage ?? ""}
              autoFocus
              required
            />
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
