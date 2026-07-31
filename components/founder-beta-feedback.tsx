"use client";

import { useEffect, useMemo, useState } from "react";
import { buildBetaEvidenceSummary, type BetaFeedbackMode } from "@/lib/beta-feedback";

type Item = {
  id: string;
  email: string;
  mode: BetaFeedbackMode;
  category: string;
  severity: "Low" | "Medium" | "High" | "Blocking";
  page_url?: string;
  summary: string;
  details: string;
  status: "Open" | "Reviewing" | "Resolved" | "Closed";
  founder_note?: string;
  device?: string;
  task_outcome?: string;
  experience_score?: number;
  trust_score?: number;
  learning_depth_score?: number;
  recommendation_score?: number;
  expected_result?: string;
  observed_result?: string;
  language_context?: string;
  regional_perspective?: string;
  heard_pronunciation?: string;
  spelling_from_audio?: string;
  name_associations?: string;
  cultural_fit?: string;
  created_at: string;
};

export function FounderBetaFeedback({
  writeKey,
  onFeedbackUpdated,
}: {
  writeKey: string;
  onFeedbackUpdated?: () => void | Promise<void>;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");
  const evidence = useMemo(() => buildBetaEvidenceSummary(items.map(item => ({ ...item, mode: item.mode || "Issue report" }))), [items]);

  useEffect(() => {
    if (!writeKey) return;
    let active = true;
    fetch("/api/beta-readiness/feedback", { headers: { "x-founder-key": writeKey } })
      .then(response => response.json())
      .then(result => {
        if (!active) return;
        result.data ? setItems(result.data) : setMessage(result.error);
      })
      .catch(() => {
        if (active) setMessage("Unable to load beta feedback.");
      });
    return () => {
      active = false;
    };
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
    await onFeedbackUpdated?.();
    setMessage("Feedback record updated.");
  }

  return <section className="founderFeedback">
    <header><div><div className="eyebrow">Beta issue desk</div><h2>Review every report before launch.</h2><p>Blocking and trust-related issues remain visible until deliberately resolved.</p></div><strong>{items.filter(item => item.status === "Open" || item.status === "Reviewing").length} open</strong></header>
    <section className="betaEvidenceMetrics" aria-label="Private beta evidence">
      <article><span>Session reviews</span><strong>{evidence.sessionReviews}</strong><small>{evidence.independentCompletions} independent</small></article>
      <article><span>Trust</span><strong>{evidence.trustAverage === undefined ? "—" : evidence.trustAverage.toFixed(1)}</strong><small>target 4.0 / 5</small></article>
      <article><span>Learning depth</span><strong>{evidence.learningAverage === undefined ? "—" : evidence.learningAverage.toFixed(1)}</strong><small>target 4.0 / 5</small></article>
      <article><span>Recommendation</span><strong>{evidence.recommendationAverage === undefined ? "—" : evidence.recommendationAverage.toFixed(1)}</strong><small>target 8.0 / 10</small></article>
      <article><span>Cultural responses</span><strong>{evidence.culturalReviews}</strong><small>target 2 credible</small></article>
      <article><span>Evidence gates</span><strong>{evidence.readyCount}/6</strong><small>{evidence.ready ? "ready for founder review" : "evidence incomplete"}</small></article>
    </section>
    <section className={`betaEvidenceGates card ${evidence.ready ? "ready" : "attention"}`}>
      <div><div className="eyebrow">Go-live evidence scorecard</div><h3>{evidence.ready ? "All evidence thresholds pass." : "Keep learning before go-live."}</h3><p>These gates support a founder decision. They never launch the platform or invite another tester automatically.</p></div>
      <div>{evidence.gates.map(gate => <article key={gate.key}><span className={gate.ready ? "pass" : "hold"}>{gate.ready ? "✓" : "!"}</span><div><b>{gate.label}</b><small>{gate.detail}</small></div></article>)}</div>
    </section>
    {message && <output>{message}</output>}
    <div>{items.map(item => <article className={`card severity-${item.severity.toLowerCase()}`} key={item.id}>
      <div className="feedbackIssueHead"><span>{item.mode || "Issue report"} · {item.category} · {item.severity} · {item.email}</span><b>{item.status}</b></div>
      <h3>{item.summary}</h3><p>{item.details}</p><small>{item.page_url || "No page supplied"} · {new Date(item.created_at).toLocaleString()}</small>
      {(item.device || item.task_outcome || item.trust_score || item.learning_depth_score || item.recommendation_score !== undefined) && <dl className="feedbackEvidence">
        {item.device && <><dt>Device</dt><dd>{item.device}</dd></>}
        {item.task_outcome && <><dt>Outcome</dt><dd>{item.task_outcome}</dd></>}
        {item.experience_score && <><dt>Ease</dt><dd>{item.experience_score}/5</dd></>}
        {item.trust_score && <><dt>Trust</dt><dd>{item.trust_score}/5</dd></>}
        {item.learning_depth_score && <><dt>Learning</dt><dd>{item.learning_depth_score}/5</dd></>}
        {item.recommendation_score !== undefined && <><dt>Recommend</dt><dd>{item.recommendation_score}/10</dd></>}
      </dl>}
      {(item.expected_result || item.observed_result) && <div className="feedbackComparison">
        {item.expected_result && <div><b>Expected</b><p>{item.expected_result}</p></div>}
        {item.observed_result && <div><b>Observed</b><p>{item.observed_result}</p></div>}
      </div>}
      {item.mode === "Name and culture" && <div className="feedbackCulture">
        <b>Confidential cultural evidence</b>
        <dl>
          {item.language_context && <><dt>Languages</dt><dd>{item.language_context}</dd></>}
          {item.regional_perspective && <><dt>Perspective</dt><dd>{item.regional_perspective}</dd></>}
          {item.heard_pronunciation && <><dt>Pronunciation</dt><dd>{item.heard_pronunciation}</dd></>}
          {item.spelling_from_audio && <><dt>Spelling from audio</dt><dd>{item.spelling_from_audio}</dd></>}
          {item.cultural_fit && <><dt>Cultural fit</dt><dd>{item.cultural_fit}</dd></>}
          {item.name_associations && <><dt>Associations</dt><dd>{item.name_associations}</dd></>}
        </dl>
      </div>}
      <form
        key={`${item.id}:${item.status}:${item.founder_note || ""}`}
        action={form => update(item, String(form.get("status")) as Item["status"], String(form.get("founderNote") || ""))}
      >
        <select name="status" defaultValue={item.status}><option>Open</option><option>Reviewing</option><option>Resolved</option><option>Closed</option></select>
        <input name="founderNote" defaultValue={item.founder_note || ""} placeholder="Response or resolution note"/>
        <button className="button secondary">Save</button>
      </form>
    </article>)}</div>
    {!items.length && <div className="emptyState">No beta feedback has been submitted.</div>}
  </section>;
}
