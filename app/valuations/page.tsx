import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadValuations } from "@/lib/data";
import { buildValuationIntelligence } from "@/lib/valuation-intelligence";
import "./valuations.css";
import "./research.css";
import { ValuationResearchPanel } from "@/components/valuation-research-panel";
import { MarketSignal, SignalLegend, confidenceTone, freshnessTone } from "@/components/market-signal";
import { RetailPricingControls } from "@/components/retail-pricing-controls";
import { retailBoxValue } from "@/lib/retail-pricing";
import { TrustMark } from "@/components/trust-mark";
import { ValuationCompletionPanel } from "@/components/valuation-completion-panel";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const unitMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default async function ValuationsPage({ searchParams }: { searchParams: Promise<{ inventoryId?: string }> }) {
  const mode = await accountDataMode();
  const filters = await searchParams;
  const [inventory, valuations] = await Promise.all([
    loadInventory(),
    mode === "mock" ? [] : loadValuations(),
  ]);
  const intelligence = buildValuationIntelligence(inventory, valuations);
  const { totals } = intelligence;

  return (
    <main className="shell wideShell valuationWorkspace">
      <section className="valueHero">
        <div>
          <div className="eyebrow">Valuation intelligence</div>
          <h1>Keep every value current.</h1>
          <p className="lede">
            A rolling review system that separates retail replacement, aftermarket
            value, and verified completed sales—calculated per cigar and
            never presented as an independent appraisal.
          </p>
          <div className="ctaRow">
            <a className="button" href="/records">
              Record price evidence
            </a>
            <a className="button secondary" href="/reports">
              Open insurance report
            </a>
            <a className="button secondary" href="/value-history">
              View value history
            </a>
          </div>
        </div>
        <div className="valueHeroCard">
          <span>Documented aftermarket value</span>
          <strong>{money.format(totals.documentedMarketValue)}</strong>
          <small>
            {totals.current} current · {intelligence.reviewQueue.length} need
            review
          </small>
        </div>
      </section>

      <section className="valueMetrics valuationMetrics">
        <article>
          <span>Retail replacement</span>
          <strong>{money.format(totals.retailReplacementValue)}</strong>
          <small>Confirmed unit retail × quantity</small>
        </article>
        <article>
          <span>Retail coverage</span>
          <strong>{totals.retailCoveragePercent}%</strong>
          <small>{totals.retailCovered} of {totals.totalLots} lots</small>
        </article>
        <article>
          <span>Aftermarket coverage</span>
          <strong>{totals.marketCoveragePercent}%</strong>
          <small>{totals.marketCovered} of {totals.totalLots} lots</small>
        </article>
        <article>
          <span>Verified-sale coverage</span>
          <strong>{totals.saleCoveragePercent}%</strong>
          <small>{totals.saleCovered} exact completed sales</small>
        </article>
        <article>
          <span>Research queue</span>
          <strong>{intelligence.reviewQueue.length}</strong>
          <small>{totals.neverValued} never valued · {totals.dueSoon + totals.stale} aging</small>
        </article>
      </section>
      <aside className="marketTrust"><div><TrustMark kind="Expert" compact/><span>Linked retailer, publication, or auction evidence</span></div><div><TrustMark kind="AI" compact/><span>Source-finding and normalization assisted by Cedriva AI</span></div><a href="/trust">Understand the evidence labels →</a></aside>
      <SignalLegend />
      <ValuationCompletionPanel items={intelligence.reviewQueue.map(row=>row.item)} mode={mode}/>
      <RetailPricingControls items={inventory} mode={mode} initialInventoryId={filters.inventoryId} />
      <ValuationResearchPanel items={intelligence.reviewQueue.map((row)=>row.item)} mode={mode}/>

      <section className="section valuationQueue">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Automated review queue</div>
            <h2>What to refresh next</h2>
          </div>
          <span className="small">
            Prioritized by freshness, source quality, and known lot value
          </span>
        </div>
        {intelligence.reviewQueue.length ? (
          <div className="queueList">
            {intelligence.reviewQueue.slice(0, 12).map((row) => (
              <article key={row.item.inventoryId}>
                <div>
                  <MarketSignal label={row.freshness} tone={freshnessTone(row.freshness)} />
                  <a href={`/inventory/${row.item.inventoryId}`}>
                    <strong>
                      {row.item.brand} {row.item.line}
                    </strong>
                    <small>
                      {row.item.vitola} · {row.item.currentQty ?? "?"} cigars
                    </small>
                  </a>
                </div>
                <div className="queueValue">
                  <span>
                    {row.latestUnit === undefined
                      ? "No market value"
                      : `${unitMoney.format(row.latestUnit)} / cigar`}
                  </span>
                  <strong>
                    {money.format(row.marketLot ?? row.retailLot ?? 0)}
                  </strong>
                </div>
                <div className="queueEvidence">
                  <span>
                    {row.latest?.valuationDate || "No valuation date"}
                  </span>
                  <small>
                    {row.latest?.sourceUrl
                      ? "Linked evidence ✓"
                      : "Source link needed"}
                  </small>
                  <small>{row.missingEvidence.join(" · ") || "Evidence complete"}</small>
                </div>
                <a
                  className="button secondary"
                  href={`/inventory/${row.item.inventoryId}#value-evidence`}
                >
                  Why / refresh
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">
            Every lot has current, linked valuation evidence.
          </div>
        )}
      </section>

      <section className="section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Price history</div>
            <h2>Portfolio valuation ledger</h2>
          </div>
          <a className="button secondary" href="/records">
            Add valuation
          </a>
        </div>
        <div className="tableWrap">
          <table className="table valueTable">
            <thead>
              <tr>
                <th>Cigar</th>
                <th>Qty</th>
                <th>Retail / stick</th>
                <th>Retail / box</th>
                <th>Aftermarket / stick</th>
                <th>Aftermarket lot</th>
                <th>Last known sale</th>
                <th>Change</th>
                <th>Freshness</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {[...intelligence.rows]
                .sort(
                  (a, b) =>
                    (b.marketLot ?? b.retailLot ?? 0) -
                    (a.marketLot ?? a.retailLot ?? 0),
                )
                .map((row) => (
                  <tr key={row.item.inventoryId}>
                    <td>
                      <a href={`/inventory/${row.item.inventoryId}`}>
                        <strong>
                          {row.item.brand} {row.item.line}
                        </strong>
                        <div className="small">
                          {row.item.inventoryId} · {row.item.vitola}
                        </div>
                      </a>
                    </td>
                    <td>{row.item.currentQty ?? "—"}</td>
                    <td>
                      {row.retailUnit === undefined
                        ? "—"
                        : unitMoney.format(row.retailUnit)}
                    </td>
                    <td>
                      {retailBoxValue(row.item) === undefined
                        ? "—"
                        : unitMoney.format(retailBoxValue(row.item)!)}
                      {row.item.sticksPerBox !== undefined && <small>{row.item.sticksPerBox} cigars</small>}
                    </td>
                    <td>
                      {row.marketUnit === undefined ? (
                        "—"
                      ) : (
                        <>
                          {unitMoney.format(row.marketUnit)}
                          <small>{row.latest?.valuationDate}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {row.marketLot === undefined
                        ? "—"
                        : money.format(row.marketLot)}
                    </td>
                    <td>{row.latest?.lastSaleValue === undefined ? "—" : <>{unitMoney.format(row.latest.lastSaleValue)}<small>{row.latest.lastSaleDate || row.latest.valuationDate}{row.latest.lastSaleVenue ? ` · ${row.latest.lastSaleVenue}` : ""}</small>{row.latest.lastSaleSourceUrl && <a className="textLink" href={row.latest.lastSaleSourceUrl} target="_blank" rel="noreferrer">Proof ↗</a>}</>}</td>
                    <td>
                      {row.changePercent === undefined ? (
                        "—"
                      ) : (
                        <span
                          className={
                            row.changePercent < 0
                              ? "negativeChange"
                              : "positiveChange"
                          }
                        >
                          {row.changePercent > 0 ? "+" : ""}
                          {row.changePercent}%
                        </span>
                      )}
                    </td>
                    <td>
                      <MarketSignal label={row.freshness} tone={freshnessTone(row.freshness)} />
                    </td>
                    <td>
                      {row.latest?.sourceUrl ? (
                        <a
                          className="textLink"
                          href={row.latest.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.latest.source || "View source"} ↗
                        </a>
                      ) : (
                        row.latest?.source || "—"
                      )}
                      <small>
                        {row.records.length} historical record
                        {row.records.length === 1 ? "" : "s"}
                      </small>
                      <MarketSignal label={`${row.latest?.confidence || "Unrated"} confidence`} tone={confidenceTone(row.latest?.confidence)} detail="Confidence reflects the quality and specificity of the recorded source evidence." />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="valuationDisclaimer">
        Values are owner-maintained estimates based on recorded sources. Auction
        prices, taxes, buyer premiums, condition, provenance, and local
        availability can materially change replacement or resale value.
      </p>
    </main>
  );
}
