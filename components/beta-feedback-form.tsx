"use client";

import { FormEvent, useEffect, useState } from "react";

type Feedback = {
  id: string;
  category: string;
  severity: string;
  page_url?: string;
  summary: string;
  details: string;
  status: string;
  founder_note?: string;
  created_at: string;
};

export function BetaFeedbackForm() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/beta-feedback")
      .then(response => response.json())
      .then(result => result.data && setItems(result.data))
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/beta-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        severity: form.get("severity"),
        pageUrl: form.get("pageUrl"),
        summary: form.get("summary"),
        details: form.get("details"),
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(result.error || "Unable to send feedback.");
      return;
    }
    setItems(current => [result.data, ...current]);
    event.currentTarget.reset();
    setMessage("Feedback received. Thank you for helping the platform earn trust.");
  }

  return <div className="feedbackLayout">
    <form className="card feedbackForm" onSubmit={submit}>
      <div><div className="eyebrow">Private beta channel</div><h2>Tell us what happened.</h2><p>Specific, candid feedback is welcome. Collection details remain private unless you intentionally include them here.</p></div>
      <label><span>What kind of feedback?</span><select name="category"><option>Bug</option><option>Confusing</option><option>Suggestion</option><option>Trust or data</option><option>Other</option></select></label>
      <label><span>Impact</span><select name="severity"><option>Low</option><option>Medium</option><option>High</option><option>Blocking</option></select></label>
      <label><span>Page or workflow</span><input name="pageUrl" placeholder="/inventory, valuation save, mobile onboarding…"/></label>
      <label><span>Short summary</span><input name="summary" minLength={5} maxLength={160} required/></label>
      <label><span>What did you expect, and what happened?</span><textarea name="details" minLength={10} maxLength={4000} rows={7} required/></label>
      <button className="button" disabled={busy}>{busy ? "Sending…" : "Send private feedback"}</button>
      {message && <output>{message}</output>}
    </form>
    <section className="feedbackHistory">
      <div><div className="eyebrow">Your reports</div><h2>Nothing disappears.</h2><p>Track what you reported and whether the team has responded.</p></div>
      {items.map(item => <article className="card" key={item.id}>
        <div><span>{item.category} · {item.severity}</span><strong>{item.summary}</strong><small>{new Date(item.created_at).toLocaleString()}</small></div>
        <b className={`feedbackStatus ${item.status.toLowerCase()}`}>{item.status}</b>
        {item.founder_note && <p>Founder response: {item.founder_note}</p>}
      </article>)}
      {!items.length && <div className="emptyState">No feedback submitted yet.</div>}
    </section>
  </div>;
}
