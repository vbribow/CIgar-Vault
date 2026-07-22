import type { buildCollectionIntelligence } from "@/lib/collection-intelligence";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const signed = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export function CollectorCommandCenter({ intelligence }: { intelligence: ReturnType<typeof buildCollectionIntelligence> }) {
  const history = intelligence.history;
  const snapshots = history.snapshots.slice(-18);
  const peak = Math.max(...snapshots.map(point => point.value), 1);
  const first = snapshots[0]?.value;
  const last = snapshots.at(-1)?.value;
  const portfolioChange = first && last ? (last - first) / first * 100 : undefined;
  const valueCoverage = intelligence.components.find(component => component.key === "value")?.score ?? 0;
  const readiness = intelligence.components.find(component => component.key === "readiness")?.score ?? 0;
  const movers = history.movers.slice(0, 5);

  return <section className="collectorTerminal" aria-labelledby="command-center-heading">
    <div className="marketTape" aria-label="Collection market summary">
      <span><small>Vault value</small><strong>{money.format(intelligence.totals.value)}</strong></span>
      <span><small>Positions</small><strong>{intelligence.totals.lots}</strong></span>
      <span><small>Cigars</small><strong>{intelligence.totals.cigars}</strong></span>
      <span><small>Value coverage</small><strong>{Math.round(valueCoverage)}%</strong></span>
      <span><small>Readiness</small><strong>{Math.round(readiness)}%</strong></span>
      <span><small>Measured movers</small><strong>{history.movers.length}</strong></span>
    </div>
    <div className="terminalHead">
      <div><div className="eyebrow">Live collection intelligence</div><h2 id="command-center-heading">Collector command center</h2><p>Portfolio movement, cellar decisions, and record exceptions—one private view.</p></div>
      <div className="terminalActions"><a href="/inventory#photo-intake">＋ Add by photo</a><a href="/inventory-count">Count vault</a><a href="/reports">Export report</a></div>
    </div>
    <div className="terminalGrid">
      <article className="portfolioPanel">
        <header><div><span>Documented portfolio value</span><strong>{money.format(history.totals.currentValue)}</strong></div><b className={portfolioChange === undefined ? "neutral" : portfolioChange >= 0 ? "positive" : "negative"}>{portfolioChange === undefined ? "Awaiting history" : signed(portfolioChange)}</b></header>
        <div className="portfolioChart" aria-label="Portfolio value history">
          {snapshots.map(point => <i key={point.date} title={`${point.date} · ${money.format(point.value)}`} style={{ height: `${Math.max(5, point.value / peak * 100)}%` }} />)}
          {!snapshots.length && <div><strong>No dated market series yet</strong><span>Add a second dated valuation to establish movement.</span></div>}
        </div>
        <footer><span>{snapshots[0]?.date ?? "First evidence"}</span><span>{history.totals.coverage}% independently valued</span><span>{snapshots.at(-1)?.date ?? "Current"}</span></footer>
      </article>
      <article className="terminalList moversPanel"><header><div><span>Market monitor</span><strong>Largest measured moves</strong></div><a href="/value-history">Full history →</a></header>
        <div>{movers.map(mover => <a href={`/inventory/${mover.item.inventoryId}`} key={mover.item.inventoryId}><span><strong>{mover.item.brand} {mover.item.line}</strong><small>{mover.item.vitola} · {money.format(mover.latestValue)}/cigar</small></span><b className={mover.changePercent >= 0 ? "positive" : "negative"}>{signed(mover.changePercent)}</b></a>)}{!movers.length && <p>Two dated valuations per cigar are required before Cigar Vault reports a move.</p>}</div>
      </article>
      <article className="terminalList"><header><div><span>Exception queue</span><strong>Records needing attention</strong></div><a href="/inventory-integrity">Audit →</a></header>
        <div>{intelligence.advisor.needsAttention.map(item => <a href={`/inventory/${item.inventoryId}`} key={item.inventoryId}><span><strong>{item.brand} {item.line}</strong><small>{[item.currentQty === undefined && "quantity", item.retailValue === undefined && "value", !item.storageLocationId && "location", !item.vintage && "release year"].filter(Boolean).join(" · ")} needed</small></span><em>Fix →</em></a>)}{!intelligence.advisor.needsAttention.length && <p>Every core inventory field is complete.</p>}</div>
      </article>
      <article className="terminalList"><header><div><span>Cellar advisor</span><strong>Smoke window</strong></div><a href="/intelligence#cellar">Advisor →</a></header>
        <div>{intelligence.advisor.smokeNow.slice(0, 5).map(item => <a href={`/inventory/${item.inventoryId}`} key={item.inventoryId}><span><strong>{item.brand} {item.line}</strong><small>{item.vintage ?? "Undated"} · {item.vitola}</small></span><em>{item.score ?? "Ready"}</em></a>)}{!intelligence.advisor.smokeNow.length && <p>Add release years to unlock evidence-based maturity guidance.</p>}</div>
      </article>
    </div>
  </section>;
}
