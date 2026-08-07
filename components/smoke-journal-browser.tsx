"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { InventoryItem, SmokingLog } from "@/lib/types";
import { buildSmokeJournalEntries, filterSmokeJournalEntries, type SmokeJournalSource } from "@/lib/smoke-journal-view";

function readableDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SmokeJournalBrowser({ smokes, inventory }: { smokes: SmokingLog[]; inventory: InventoryItem[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SmokeJournalSource>("all");
  const entries = useMemo(() => buildSmokeJournalEntries(smokes, inventory), [smokes, inventory]);
  const shown = useMemo(() => filterSmokeJournalEntries(entries, query, source), [entries, query, source]);
  const vaultCount = entries.filter(entry => entry.source === "vault").length;

  return <>
    <section className="journalMetrics" aria-label="Smoke journal summary">
      <article><strong>{entries.length}</strong><span>total smokes logged</span></article>
      <article><strong>{vaultCount}</strong><span>linked to your Vault</span></article>
      <article><strong>{entries.length - vaultCount}</strong><span>review-only entries</span></article>
      <article><strong>{entries.filter(entry => entry.smoke.buyAgain).length}</strong><span>marked buy again</span></article>
    </section>

    <section className="card journalControls" aria-label="Search smoke journal">
      <label><span>Search your journal</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cigar, flavor, note, date, or Vault ID" /></label>
      <label><span>Entry source</span><select value={source} onChange={event => setSource(event.target.value as SmokeJournalSource)}><option value="all">All entries</option><option value="vault">From my Vault</option><option value="review">Review only</option></select></label>
      {(query || source !== "all") && <button type="button" className="button secondary" onClick={() => { setQuery(""); setSource("all"); }}>Clear filters</button>}
    </section>

    <section className="journalResults" aria-live="polite">
      <header><div><div className="eyebrow">Private tasting history</div><h2>{shown.length} entr{shown.length === 1 ? "y" : "ies"}</h2></div><Link className="button" href="/records#log-smoke">Log a smoke</Link></header>
      {shown.map(entry => {
        const content = <>
          <div className="journalEntryLead"><span>{entry.source === "vault" ? "Vault smoke" : "Review only"}</span><h3>{entry.title}</h3><small>{entry.detail}</small></div>
          <div className="journalEntryFacts"><time dateTime={entry.smoke.dateSmoked}>{readableDate(entry.smoke.dateSmoked)}</time><strong>{entry.smoke.overall ?? "—"}<small> / 100</small></strong></div>
          <div className="journalEntryNotes"><p>{entry.smoke.tastingNotes || entry.smoke.flavor || "No tasting note recorded."}</p><div>{entry.smoke.flavor && <span>{entry.smoke.flavor}</span>}{entry.smoke.strength && <span>{entry.smoke.strength}</span>}{entry.smoke.construction && <span>{entry.smoke.construction}</span>}{entry.smoke.burn && <span>{entry.smoke.burn}</span>}{entry.smoke.buyAgain && <span>★ Buy again</span>}</div></div>
          {entry.item && <b className="journalEntryOpen">Open cigar record →</b>}
        </>;
        return entry.item
          ? <Link className="journalEntry" href={`/inventory/${encodeURIComponent(entry.item.inventoryId)}`} key={entry.smoke.smokeId}>{content}</Link>
          : <article className="journalEntry" key={entry.smoke.smokeId}>{content}</article>;
      })}
      {!shown.length && <div className="emptyState"><strong>{entries.length ? "No journal entries match those filters." : "No smokes logged yet."}</strong><p>{entries.length ? "Try another cigar, flavor, date, or entry source." : "Your first note can be simple and entirely your own."}</p>{!entries.length && <Link className="button" href="/records#log-smoke">Log your first smoke</Link>}</div>}
    </section>
  </>;
}
