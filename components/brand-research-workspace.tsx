"use client";

import { useState } from "react";
import type { BrandResearchItem } from "@/lib/brand-research";
import { brandResearchBrief } from "@/lib/brand-research";
import type { BrandResearchReport } from "@/lib/brand-research-report";

export function BrandResearchWorkspace({ item }: { item: BrandResearchItem }) {
  const brief = brandResearchBrief(item);
  const [key, setKey] = useState("");
  const [report, setReport] = useState<BrandResearchReport | null>(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  async function runResearch() {
    setRunning(true);
    setMessage("");
    setReport(null);
    try {
      const response = await fetch("/api/brand-research", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-founder-key": key },
        body: JSON.stringify({ brand: item.brand }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Brand research failed");
      setReport(result.data);
      setMessage("Research complete. Review every claim and source before publication.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Brand research failed");
    } finally {
      setRunning(false);
    }
  }

  return <>
    <section className="brandResearchPlan">
      <article>
        <span>Primary research question</span>
        <h2>{brief.question}</h2>
        <p>{brief.publicationRule}</p>
      </article>
      <article>
        <span>Evidence required</span>
        <div>{item.missing.map((field) => <strong key={field}>{field}</strong>)}</div>
        <ol>{brief.sourceOrder.map((source, index) => <li key={source}><i>{String(index + 1).padStart(2, "0")}</i>{source}</li>)}</ol>
      </article>
    </section>

    <section className="brandResearchRunner">
      <div><div className="eyebrow">Live source research</div><h2>Build the evidence report.</h2><p>Cedriva searches primary and established trade sources, keeps line-level factory relationships separate, and returns unresolved questions without guessing.</p></div>
      <div className="brandResearchRunControls">
        <label><span>Founder write key</span><input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Required to run research" /></label>
        <button className="button" type="button" disabled={!key || running} onClick={runResearch}>{running ? "Researching trusted sources…" : `Research ${item.brand}`}</button>
        {message && <output aria-live="polite">{message}</output>}
      </div>
    </section>

    {report && <section className="brandResearchReport" aria-live="polite">
      <header><div><div className="eyebrow">Research report · {report.researchedAt.slice(0, 10)}</div><h2>{report.brand}</h2><p>{report.summary}</p></div><strong>Founder review required</strong></header>
      <article className="brandResearchOwner">
        <span>Brand owner</span><h3>{report.brandOwner.value}</h3>
        <div><b>{report.brandOwner.status}</b><b>{report.brandOwner.confidence} confidence</b></div>
        <p>{report.brandOwner.notes}</p>
        {report.brandOwner.sourceUrl && <a href={report.brandOwner.sourceUrl} target="_blank" rel="noreferrer">{report.brandOwner.sourceTitle} ↗</a>}
      </article>
      <div className="brandResearchReportGrid">
        <section><div className="eyebrow">Creative authorship</div>{report.creativeAuthorship.map((claim, index) => <article key={`${claim.value}-${index}`}><h3>{claim.value}</h3><div><b>{claim.status}</b><b>{claim.confidence}</b></div><p>{claim.notes}</p>{claim.sourceUrl && <a href={claim.sourceUrl} target="_blank" rel="noreferrer">{claim.sourceTitle} ↗</a>}</article>)}</section>
        <section><div className="eyebrow">Actual manufacturing</div>{report.manufacturingRelationships.map((claim, index) => <article key={`${claim.factory}-${claim.lineOrRelease}-${index}`}><h3>{claim.factory}</h3><strong>{claim.lineOrRelease}</strong><small>{claim.country} · {claim.productionPeriod} · {claim.relationship}</small><div><b>{claim.status}</b><b>{claim.confidence}</b></div><p>{claim.notes}</p>{claim.sourceUrl && <a href={claim.sourceUrl} target="_blank" rel="noreferrer">{claim.sourceTitle} ↗</a>}</article>)}</section>
      </div>
      <section className="brandResearchSources"><div className="eyebrow">Source ledger</div>{report.officialSources.map((source) => <a href={source.url} key={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.publisher}</span><p>{source.supports}</p></a>)}</section>
      <section className="brandResearchQuestions"><div className="eyebrow">Still unresolved</div>{report.unresolvedQuestions.length ? <ol>{report.unresolvedQuestions.map((question) => <li key={question}>{question}</li>)}</ol> : <p>No unresolved questions were returned. Founder verification is still required before publication.</p>}</section>
    </section>}
  </>;
}
