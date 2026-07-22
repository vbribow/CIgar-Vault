import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadValuations } from "@/lib/data";
import { buildValuationIntelligence } from "@/lib/valuation-intelligence";
import "./valuations.css";
import "./research.css";
import { ValuationResearchPanel } from "@/components/valuation-research-panel";

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

export default async function ValuationsPage() {
  const mode = await accountDataMode();
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
            A rolling review system for dated retail and auction
            evidence—calculated per cigar, multiplied by the quantity you own,
            and never presented as an independent appraisal.
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
          <span>Documented market value</span>
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
          <span>Current</span>
          <strong>{totals.current}</strong>
          <small>Reviewed within 120 days</small>
        </article>
        <article>
          <span>Due or stale</span>
          <strong>{totals.dueSoon + totals.stale}</strong>
          <small>
            {totals.dueSoon} due soon · {totals.stale} over 180 days
          </small>
        </article>
        <article>
          <span>Never valued</span>
          <strong>{totals.neverValued}</strong>
          <small>Need first market evidence</small>
        </article>
        <article>
          <span>Traceable sources</span>
          <strong>{totals.sourced}</strong>
          <small>Latest records with source links</small>
        </article>
      </section>
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
                  <span
                    className={`freshness freshness-${row.freshness.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    {row.freshness}
                  </span>
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
                </div>
                <a
                  className="button secondary"
                  href={`/records?inventoryId=${row.item.inventoryId}`}
                >
                  Refresh
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
                <th>Latest market</th>
                <th>Market lot</th>
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
                      {row.item.retailValue === undefined
                        ? "—"
                        : unitMoney.format(row.item.retailValue)}
                    </td>
                    <td>
                      {row.latestUnit === undefined ? (
                        "—"
                      ) : (
                        <>
                          {unitMoney.format(row.latestUnit)}
                          <small>{row.latest?.valuationDate}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {row.marketLot === undefined
                        ? "—"
                        : money.format(row.marketLot)}
                    </td>
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
                      <span
                        className={`freshness freshness-${row.freshness.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {row.freshness}
                      </span>
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
