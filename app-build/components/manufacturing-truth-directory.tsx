"use client";

import { useMemo, useState } from "react";
import type { BrandManufacturingCoverage, BrandManufacturingStatus, ManufacturingTruthRecord } from "@/lib/manufacturing-truth";

const relationships = ["All relationships", "Vertically integrated", "Company-owned factory", "Partner-owned factory", "Directed contract production", "Mixed production"] as const;

export function ManufacturingTruthDirectory({ records }: { records: ManufacturingTruthRecord[] }) {
  const [query, setQuery] = useState("");
  const [relationship, setRelationship] = useState<(typeof relationships)[number]>("All relationships");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const searchable = [record.brand, record.owner, record.blender, ...record.factories, ...record.factoryCountries, ...record.tobaccoRegions, ...record.examples].join(" ").toLowerCase();
      return (!needle || searchable.includes(needle)) && (relationship === "All relationships" || record.relationship === relationship);
    });
  }, [query, records, relationship]);

  return <>
    <div className="truthControls">
      <label><span>Search the record</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, blender, factory, country, or region" /></label>
      <label><span>Production relationship</span><select value={relationship} onChange={(event) => setRelationship(event.target.value as (typeof relationships)[number])}>{relationships.map((item) => <option key={item}>{item}</option>)}</select></label>
      <output aria-live="polite"><strong>{filtered.length}</strong><span>verified record{filtered.length === 1 ? "" : "s"}</span></output>
    </div>
    <div className="truthDirectory">
      {filtered.map((record) => <article id={record.id} key={record.id}>
        <header>
          <div><span className="truthRelationship">{record.relationship}</span><h2>{record.brand}</h2><p>{record.owner}</p></div>
          <div className="truthBadge" data-level={record.trustLevel}><strong>{record.trustLevel}</strong><span>{record.confidence} confidence</span></div>
        </header>
        <div className="truthIdentity">
          <dl>
            <div><dt>Creative authorship</dt><dd>{record.blender}</dd></div>
            <div><dt>Actual manufacturing</dt><dd>{record.factories.join(" · ")}</dd></div>
            <div><dt>Factory country</dt><dd>{record.factoryCountries.join(" · ")}</dd></div>
            <div><dt>Relevant tobacco regions</dt><dd>{record.tobaccoRegions.join(" · ")}</dd></div>
          </dl>
          <div className="truthStatement"><span>What the record supports</span><p>{record.truth}</p></div>
        </div>
        <div className="truthRules">
          <div><strong>Release-level rule</strong><p>{record.releaseRule}</p></div>
          <div><strong>Historical continuity</strong><p>{record.history}</p></div>
        </div>
        <footer>
          <div>{record.examples.map((example) => <span key={example}>{example}</span>)}</div>
          <a href={record.sourceUrl} target="_blank" rel="noreferrer"><small>Checked {record.checkedAt}</small><strong>{record.sourceName} ↗</strong></a>
        </footer>
      </article>)}
      {!filtered.length && <div className="truthEmpty"><strong>No record matches those terms yet.</strong><p>Try a factory, country, blender, or broader brand name. The directory will grow as evidence is verified.</p></div>}
    </div>
  </>;
}

const coverageStatuses: ("All statuses" | BrandManufacturingStatus)[] = ["All statuses", "Factory verified", "Country verified", "Research needed"];

export function ManufacturingCoverageIndex({ records }: { records: BrandManufacturingCoverage[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof coverageStatuses)[number]>("All statuses");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const matchesQuery = !needle || [record.brand, record.primaryRegion, record.segment, record.manufacturing].join(" ").toLocaleLowerCase().includes(needle);
      return matchesQuery && (status === "All statuses" || record.status === status);
    });
  }, [query, records, status]);
  const counts = Object.fromEntries(coverageStatuses.slice(1).map((item) => [item, records.filter((record) => record.status === item).length]));

  return <>
    <div className="coverageMetrics">
      <article><strong>{records.length}</strong><span>brands represented</span></article>
      <article><strong>{counts["Factory verified"]}</strong><span>factory verified</span></article>
      <article><strong>{counts["Country verified"]}</strong><span>official country records</span></article>
      <article><strong>{counts["Research needed"]}</strong><span>visible evidence gaps</span></article>
    </div>
    <div className="coverageControls">
      <label><span>Search all brands</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, region, or known factory" /></label>
      <label><span>Evidence status</span><select value={status} onChange={(event) => setStatus(event.target.value as (typeof coverageStatuses)[number])}>{coverageStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      <output aria-live="polite"><strong>{filtered.length}</strong><span>brand record{filtered.length === 1 ? "" : "s"}</span></output>
    </div>
    <div className="coverageIndex">
      {filtered.map((record) => <article key={record.brand} data-status={record.status}>
        <div><span>{record.primaryRegion} · {record.segment}</span><h3>{record.brand}</h3></div>
        <div className="coverageStatus"><strong>{record.status}</strong><span>{record.evidence}</span></div>
        <p>{record.manufacturing}</p>
        <div className="coverageLinks"><a href={record.href}>{record.recordId ? "Open verified system" : record.status === "Country verified" ? "Review coverage rule" : "Review research standard"} →</a>{record.sourceUrl && <a href={record.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}</div>
      </article>)}
    </div>
  </>;
}
