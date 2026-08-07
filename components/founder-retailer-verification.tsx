"use client";
import { FormEvent, useEffect, useState } from "react";
import "./founder-retailer-verification.css";

type PendingPurchase = {
  id: string;
  inventory_id: string;
  retailer_name: string;
  listing_url: string;
  receipt_evidence_url: string;
  purchase_date: string;
  updated_at: string;
};

export function FounderRetailerVerification({ writeKey }: { writeKey: string }) {
  const [items, setItems] = useState<PendingPurchase[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const response = await fetch("/api/retailer-market/verification", { headers: { "x-founder-key": writeKey } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Verification queue could not be loaded");
    setItems(result.data);
  }

  useEffect(() => {
    load().catch(error => setMessage(error instanceof Error ? error.message : "Verification queue could not be loaded"));
  }, [writeKey]);

  async function decide(event: FormEvent<HTMLFormElement>, item: PendingPurchase) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const decision = String(form.get("decision"));
    setBusy(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/retailer-market/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-founder-key": writeKey },
        body: JSON.stringify({ purchaseSessionId: item.id, decision, note: form.get("note") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Verification decision could not be saved");
      setItems(current => current.filter(value => value.id !== item.id));
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification decision could not be saved");
    } finally {
      setBusy("");
    }
  }

  return <section className="founderRetailerVerification">
    <header>
      <div><div className="eyebrow">Trusted retailer evidence</div><h2>Purchase verification</h2><p>Only evidence reviewed here can unlock one transaction-backed retailer rating. Relationships, affiliate arrangements, and launch placement never affect this decision.</p></div>
      <strong>{items.length}</strong>
    </header>
    {message && <output aria-live="polite">{message}</output>}
    <div>
      {items.map(item => <article className="card" key={item.id}>
        <div>
          <small>{item.inventory_id} · purchased {item.purchase_date}</small>
          <h3>{item.retailer_name}</h3>
          <p>Submitted {new Date(item.updated_at).toLocaleDateString()}</p>
          <div className="betaEmailActions">
            <a href={item.listing_url} target="_blank" rel="noreferrer">Exact seller listing</a>
            <a href={item.receipt_evidence_url} target="_blank" rel="noreferrer">Private receipt evidence</a>
          </div>
        </div>
        <form onSubmit={event => decide(event, item)}>
          <label><span>Decision note</span><textarea name="note" rows={3} minLength={10} maxLength={2000} required placeholder="State what was checked and why the evidence is sufficient or insufficient."/></label>
          <div className="betaEmailActions">
            <button className="button" name="decision" value="verified" disabled={busy === item.id}>{busy === item.id ? "Saving…" : "Verify transaction"}</button>
            <button className="button secondary" name="decision" value="rejected" disabled={busy === item.id}>Reject evidence</button>
          </div>
        </form>
      </article>)}
      {!items.length && <div className="emptyState">No purchase evidence is awaiting review.</div>}
    </div>
  </section>;
}
