"use client";

import { useMemo, useState } from "react";
import type { BrandResearchItem } from "@/lib/brand-research";

const priorities = ["All priorities", "Boutique priority", "Established priority", "Historical follow-up"] as const;

export function BrandResearchBacklog({ items }: { items: BrandResearchItem[] }) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<(typeof priorities)[number]>("All priorities");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return items.filter((item) => (!needle || [item.brand, item.primaryRegion, item.segment, ...item.missing].join(" ").toLocaleLowerCase().includes(needle))
      && (priority === "All priorities" || item.priority === priority));
  }, [items, priority, query]);

  return <section className="researchBacklog" id="research-backlog">
    <div className="researchSectionHead"><div><div className="eyebrow">Evidence backlog</div><h2>Unknown is a work queue—not a guess.</h2></div><p>Boutique brands rise first because their manufacturing relationships are least likely to be preserved elsewhere. Every record names exactly what evidence is still missing.</p></div>
    <div className="backlogControls">
      <label><span>Search evidence gaps</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, region, or missing fact" /></label>
      <label><span>Research priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as (typeof priorities)[number])}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
      <output><strong>{filtered.length}</strong><span>open records</span></output>
    </div>
    <div className="backlogGrid">{filtered.map((item) => <article key={item.brand}>
      <header><span>{item.priority}</span><strong>{item.status}</strong></header>
      <h3>{item.brand}</h3><p>{item.primaryRegion} · {item.segment}</p>
      <div>{item.missing.map((field) => <span key={field}>{field}</span>)}</div>
      <a href={item.href}>Open evidence standard →</a>
    </article>)}</div>
  </section>;
}
