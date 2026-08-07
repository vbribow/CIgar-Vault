"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClientUuid } from "@/lib/client-uuid";
import styles from "./buy-again-panel.module.css";

type Props = {
  inventoryId: string;
  identity: string;
  seller?: string;
  purchaseDate?: string;
  jurisdiction?: string;
  sourceUrl?: string;
  positiveJournalCount: number;
};

export function BuyAgainPanel({ inventoryId, identity, seller, purchaseDate, jurisdiction, sourceUrl, positiveJournalCount }: Props) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const submissionId = useRef(createClientUuid());
  const saveInFlight = useRef(false);

  async function addToBuyingList() {
    if (saveInFlight.current || state === "saved") return;
    saveInFlight.current = true; setState("saving"); setMessage("");
    try {
      const response = await fetch("/api/wishlist/buy-again", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inventoryId, submissionId: submissionId.current }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The buying list could not be updated.");
      setState("saved");
      setMessage(result.reopened ? "This cigar is back on your buying list." : result.existing ? "This cigar is already on your buying list." : "This exact cigar was added to your private buying list.");
    } catch (error) {
      setState("error"); setMessage(error instanceof Error ? error.message : "The buying list could not be updated. Try again.");
    } finally { saveInFlight.current = false; }
  }

  return <section className={styles.panel} aria-labelledby="buy-again-title">
    <div><div className="eyebrow">Simple collector utility · no AI credits</div><h2 id="buy-again-title">Buy this cigar again</h2><p>{sourceUrl ? `Return to ${seller || "your recorded purchase source"} for the exact cigar you documented.` : "No reusable purchase link is recorded. Keep the exact cigar on your private buying list instead."}</p><div className={styles.facts}><span><small>Exact cigar</small><strong>{identity}</strong></span><span><small>Last seller</small><strong>{seller || "Not recorded"}</strong></span><span><small>Last purchase</small><strong>{purchaseDate || "Not recorded"}</strong></span>{jurisdiction && <span><small>Recorded jurisdiction</small><strong>{jurisdiction}</strong></span>}</div></div>
    <div className={styles.actions}>{sourceUrl && <a className="button" href={sourceUrl} target="_blank" rel="noreferrer">Buy again from {seller || "recorded source"} ↗</a>}<button className={sourceUrl ? "button secondary" : "button"} type="button" disabled={state === "saving" || state === "saved"} onClick={addToBuyingList}>{state === "saving" ? "Adding…" : state === "saved" ? "On buying list ✓" : "Add to buying list"}</button>{state === "saved" && <Link className="textLink" href="/wishlist">Open buying list →</Link>}<small>{positiveJournalCount ? `You marked Buy Again on ${positiveJournalCount} journal ${positiveJournalCount === 1 ? "entry" : "entries"}. ` : ""}Recorded sources are collector-provided. Availability, price, shipping eligibility, and seller status are not verified here. No commercial relationship influences this placement.</small><output aria-live="polite" className={state === "error" ? styles.error : undefined}>{message}</output></div>
  </section>;
}
