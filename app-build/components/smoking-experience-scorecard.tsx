import type { SmokingExperienceScorecard } from "@/lib/smoking-scorecard";

const value = (text: string | number | undefined) => text === undefined ? "Not yet rated" : text;
const distribution = (items: { label: string; count: number }[]) => items.length ? items.map(item => `${item.label} (${item.count})`).join(" · ") : "Not yet rated";

export function SmokingExperienceScorecardView({ lot, identity }: { lot: SmokingExperienceScorecard; identity?: SmokingExperienceScorecard }) {
  const summary = identity && (identity.lotCount > 1 || identity.experienceCount !== lot.experienceCount) ? identity : lot;
  const experienceLabel = summary.experienceCount === 1 ? "One experience" : `${summary.experienceCount} experiences`;
  return <section className="section card" aria-labelledby="smoking-scorecard-title">
    <div className="sectionHead"><div><div className="eyebrow">Private Smoking Experience Scorecard</div><h2 id="smoking-scorecard-title">{experienceLabel}</h2><p className="small">{summary.scope === "exact identity" ? `Exact identity across ${summary.lotCount} legitimate lot${summary.lotCount === 1 ? "" : "s"}.` : "This inventory lot only."} {summary.experienceCount < 2 ? summary.experienceCount === 1 ? "One experience is not a trend." : "No missing rating is treated as zero." : "Every result is sourced to your journal entries."}</p></div></div>
    <div className="detailStats">
      <div><span>Overall score</span><strong>{value(summary.overall.average)}</strong><small>{summary.overall.count ? `${summary.overall.count} rated experience${summary.overall.count === 1 ? "" : "s"}` : "Not yet rated"}</small></div>
      <div><span>Construction Quality</span><strong>{value(summary.construction.latest)}</strong><small>{summary.construction.trend ? `${summary.construction.trend.label} across ${summary.construction.trend.count} ratings` : summary.construction.count ? "Latest rating · no trend claimed" : "Not yet rated"}</small></div>
      <div><span>Burn</span><strong>{value(summary.burn.latest)}</strong><small>{summary.burn.trend ? `${summary.burn.trend.label} across ${summary.burn.trend.count} ratings` : summary.burn.count ? "Latest rating · no trend claimed" : "Not yet rated"}</small></div>
      <div><span>Perceived strength</span><strong>{value(summary.strength.latest)}</strong><small>{summary.strength.count ? `${summary.strength.count} rated experience${summary.strength.count === 1 ? "" : "s"}` : "Not yet rated"}</small></div>
      <div><span>Common flavor notes</span><strong>{summary.flavors[0]?.label || "Not yet rated"}</strong><small>{distribution(summary.flavors)}</small></div>
      <div><span>Buy Again</span><strong>{summary.buyAgain.rate === undefined ? "Not yet rated" : `${summary.buyAgain.rate}%`}</strong><small>{summary.buyAgain.count ? `${summary.buyAgain.yes} yes of ${summary.buyAgain.count} answered` : "Not yet rated"}</small></div>
    </div>
    <details><summary>View evidence breakdown and history</summary>
      <p className="small"><strong>Construction:</strong> {distribution(summary.construction.distribution)}</p>
      <p className="small"><strong>Burn:</strong> {distribution(summary.burn.distribution)}</p>
      <p className="small"><strong>Strength:</strong> {distribution(summary.strength.distribution)}</p>
      {summary.history.map(entry => <p className="historyRow" key={entry.smokeId}><span>{entry.dateSmoked}<small>{[entry.construction && `Construction: ${entry.construction}`, entry.burn && `Burn: ${entry.burn}`, entry.strength && `Strength: ${entry.strength}`].filter(Boolean).join(" · ") || "Structured ratings not yet added"}</small></span><strong>{entry.overall ?? "Not rated"}</strong></p>)}
      {!summary.history.length && <p className="small">No private smoking entries yet.</p>}
      <a className="textLink" href="/records#smoking-history">Open individual journal entries →</a>
    </details>
    {identity && identity.lotCount > 1 && <details><summary>Compare with this inventory lot</summary><p className="small">{lot.experienceCount === 1 ? "One experience" : `${lot.experienceCount} experiences`} belongs to this lot; the primary scorecard combines only lots with the same complete canonical identity.</p></details>}
  </section>;
}
