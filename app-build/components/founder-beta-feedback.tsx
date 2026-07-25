"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  email: string;
  category: string;
  severity: string;
  page_url?: string;
  summary: string;
  details: string;
  status: "Open" | "Reviewing" | "Resolved" | "Closed";
  founder_note?: string;
  created_at: string;
};

export function FounderBetaFeedback({ writeKey }: { writeKey: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/beta-readiness/feedback", { headers: { "x-founder-key": writeKey } })
      .then(response => response.json())
      .then(result => result.data ? setItems(result.data) : setMessage(result.error))
      .catch(() => setMessage("Unable to load beta feedback."));
  }, [writeKey]);

  async function update(item: Item, status: Item["status"], founderNote: string) {
    const response = await fetch("/api/beta-readiness/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-founder-key": writeKey },
      body: JSON.stringify({ id: item.id, status, founderNote }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Unable to update feedback.");
      return;
    }
    setItems(current => current.map(value => value.id === item.id ? { ...value, ...result.data } : value));
    setMessage("Feedback record updated.");
  }

  return <section className="founderFeedback">
    <header><div><div className="eyebrow">Beta issue desk</div><h2>Review every report before launch.</h2><p>Blocking and trust-related issues remain visible until deliberately resolved.</p></div><strong>{items.filter(item => item.status === "Open" || item.status === "Reviewing").length} open</strong></header>
    {message && <output>{message}</output>}
    <div>{items.map(item => <article className={`card severity-${item.severity.toLowerCase()}`} key={item.id}>
      <div className="feedbackIssueHead"><span>{item.category} · {item.severity} · {item.email}</span><b>{item.status}</b></div>
      <h3>{item.summary}</h3><p>{item.details}</p><small>{item.page_url || "No page supplied"} · {new Date(item.created_at).toLocaleString()}</small>
      <form action={form => update(item, String(form.get("status")) as Item["status"], String(form.get("founderNote") || ""))}>
        <select name="status" defaultValue={item.status}><option>Open</option><option>Reviewing</option><option>Resolved</option><option>Closed</option></select>
        <input name="founderNote" defaultValue={item.founder_note || ""} placeholder="Response or resolution note"/>
        <button className="button secondary">Save</button>
      </form>
    </article>)}</div>
    {!items.length && <div className="emptyState">No beta feedback has been submitted.</div>}
  </section>;
}
