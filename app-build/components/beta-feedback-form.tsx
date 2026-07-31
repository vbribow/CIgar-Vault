"use client";

import { FormEvent, useEffect, useState } from "react";
import type { BetaFeedbackMode } from "@/lib/beta-feedback";
import { captureOperationalFailure } from "@/lib/operational-failure";

type Feedback = {
  id: string;
  mode: BetaFeedbackMode;
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
  const [mode, setMode] = useState<BetaFeedbackMode>("Issue report");

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
    const text = (name: string) => String(form.get(name) || "").trim() || undefined;
    const score = (name: string) => {
      const value = text(name);
      return value === undefined ? undefined : Number(value);
    };
    try{const response = await fetch("/api/beta-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode,
        category: form.get("category"),
        severity: form.get("severity"),
        pageUrl: text("pageUrl"),
        summary: text("summary"),
        details: text("details"),
        device: text("device"),
        taskOutcome: text("taskOutcome"),
        experienceScore: score("experienceScore"),
        trustScore: score("trustScore"),
        learningDepthScore: score("learningDepthScore"),
        recommendationScore: score("recommendationScore"),
        expectedResult: text("expectedResult"),
        observedResult: text("observedResult"),
        languageContext: text("languageContext"),
        regionalPerspective: text("regionalPerspective"),
        heardPronunciation: text("heardPronunciation"),
        spellingFromAudio: text("spellingFromAudio"),
        nameAssociations: text("nameAssociations"),
        culturalFit: text("culturalFit"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      void captureOperationalFailure("feedback-submit",response.status);
      setMessage(result.error || "Unable to send feedback.");
      return;
    }
    setItems(current => [result.data, ...current]);
    event.currentTarget.reset();
    setMode("Issue report");
    setMessage("Feedback received. Thank you for helping the platform earn trust.");
    }catch{void captureOperationalFailure("feedback-submit");setMessage("Unable to send feedback. Check your connection and try again.")}finally{setBusy(false)}
  }

  return <div className="feedbackLayout">
    <form className="card feedbackForm" onSubmit={submit}>
      <div><div className="eyebrow">Private beta channel</div><h2>Share evidence, not just impressions.</h2><p>Choose the kind of review you are completing. Collection details remain private unless you intentionally include them here.</p></div>
      <fieldset className="feedbackMode">
        <legend>What are you reviewing?</legend>
        {(["Issue report", "Session review", "Name and culture"] as BetaFeedbackMode[]).map(value =>
          <label key={value}><input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)}/><span>{value}</span></label>
        )}
      </fieldset>
      <label><span>What kind of feedback?</span><select name="category"><option>Bug</option><option>Confusing</option><option>Suggestion</option><option>Trust or data</option><option>Other</option></select></label>
      <label><span>Impact</span><select name="severity"><option>Low</option><option>Medium</option><option>High</option><option>Blocking</option></select></label>
      <label><span>Device</span><select name="device" defaultValue=""><option value="">Choose when relevant</option><option>Desktop</option><option>Mobile</option><option>Tablet</option><option>Other</option></select></label>
      <label><span>Page or workflow</span><input name="pageUrl" placeholder="/inventory, valuation save, mobile onboarding…"/></label>
      {mode === "Issue report" && <>
        <label><span>What did you expect?</span><textarea name="expectedResult" maxLength={2000} rows={3}/></label>
        <label><span>What actually happened?</span><textarea name="observedResult" maxLength={2000} rows={3}/></label>
      </>}
      {mode === "Session review" && <section className="feedbackStructured">
        <div><strong>Session evidence</strong><small>Score the experience you just completed—not the idea of the product.</small></div>
        <label><span>Task outcome</span><select name="taskOutcome" required><option>Completed independently</option><option>Completed with help</option><option>Could not complete</option><option>Not applicable</option></select></label>
        <div className="feedbackScores">
          <label><span>Ease and confidence</span><select name="experienceScore" required defaultValue=""><option value="" disabled>Choose</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          <label><span>Trust</span><select name="trustScore" required defaultValue=""><option value="" disabled>Choose</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          <label><span>Learning depth</span><select name="learningDepthScore" required defaultValue=""><option value="" disabled>Choose</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          <label><span>Would recommend</span><select name="recommendationScore" required defaultValue=""><option value="" disabled>Choose</option>{[0,1,2,3,4,5,6,7,8,9,10].map(value => <option key={value} value={value}>{value} / 10</option>)}</select></label>
        </div>
      </section>}
      {mode === "Name and culture" && <section className="feedbackStructured confidential">
        <div><strong>Confidential name and cultural response</strong><small>Complete this only when Brian personally asks. Do not repeat or share the confidential candidate outside the approved beta.</small></div>
        <label><span>Languages you use comfortably</span><input name="languageContext" maxLength={200} required placeholder="Spanish and English"/></label>
        <label><span>Regional or cultural perspective</span><input name="regionalPerspective" maxLength={200} required placeholder="Dominican Republic, Nicaragua, U.S. bilingual…"/></label>
        <label><span>What pronunciation did you hear or use?</span><input name="heardPronunciation" maxLength={200}/></label>
        <label><span>Spell what you heard without looking at the written form</span><input name="spellingFromAudio" maxLength={200} required/></label>
        <label><span>What words, places, cultures, products, or feelings did it bring to mind?</span><textarea name="nameAssociations" maxLength={2000} rows={4} required/></label>
        <label><span>Cultural credibility</span><select name="culturalFit" required><option>Credible</option><option>Mostly credible</option><option>Uncertain</option><option>Forced</option><option>Concerning</option></select></label>
      </section>}
      <label><span>Short summary</span><input name="summary" minLength={5} maxLength={160} required/></label>
      <label><span>{mode === "Issue report" ? "Anything else we should know?" : "Explain your response in your own words"}</span><textarea name="details" minLength={10} maxLength={4000} rows={7} required/></label>
      <button className="button" disabled={busy}>{busy ? "Sending…" : "Send private feedback"}</button>
      {message && <output>{message}</output>}
    </form>
    <section className="feedbackHistory">
      <div><div className="eyebrow">Your reports</div><h2>Nothing disappears.</h2><p>Track what you reported and whether the team has responded.</p></div>
      {items.map(item => <article className="card" key={item.id}>
        <div><span>{item.mode || "Issue report"} · {item.category} · {item.severity}</span><strong>{item.summary}</strong><small>{new Date(item.created_at).toLocaleString()}</small></div>
        <b className={`feedbackStatus ${item.status.toLowerCase()}`}>{item.status}</b>
        {item.founder_note && <p>Founder response: {item.founder_note}</p>}
      </article>)}
      {!items.length && <div className="emptyState">No feedback submitted yet.</div>}
    </section>
  </div>;
}
