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
import { completedSaleLabel, marketAskingPriceLabel, marketRangeText } from "@/lib/valuation-evidence";
import { valuationNeedsMonitoring } from "@/lib/valuation-monitor";

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

export default async function ValuationsPage({ searchParams }: { searchParams: Promise<{ inventoryId?: string;collectionId?:string }> }) {
  const filters = await searchParams;
  const [modeResult, inventoryResult, valuationsResult] =
    await Promise.allSettled([
      accountDataMode(),
      loadInventory(),
      loadValuations(),
    ]);
  if (
    modeResult.status !== "fulfilled" ||
    inventoryResult.status !== "fulfilled" ||
    valuationsResult.status !== "fulfilled"
  ) {
    return (
      <main className="shell wideShell valuationWorkspace">
        <section className="valueHero">
          <div>
            <div className="eyebrow">Valuation intelligence</div>
            <h1>Values are temporarily protected.</h1>
            <p className="lede">
              The platform could not safely load inventory and valuation evidence
              together. No portfolio total, coverage percentage, or missing
              value has been inferred from partial data.
            </p>
          </div>
          <div className="valueHeroCard valuationUnavailable">
            <span>Documented aftermarket value</span>
            <strong>—</strong>
            <small>Refresh after the account service recovers</small>
          </div>
        </section>
      </main>
    );
  }
  const mode = modeResult.value;
  const inventory = inventoryResult.value;
  const valuations = valuationsResult.value;
  const activeInventory=inventory.filter(item=>(item.currentQty??0)>0);
  const intelligence = buildValuationIntelligence(activeInventory, valuations);
  const { totals } = intelligence;
  const scopedInventory=filters.collectionId?activeInventory.filter(item=>item.collectionId===filters.collectionId):activeInventory;
  const completionQueue=intelligence.reviewQueue.filter(row=>
    (!filters.collectionId||row.item.collectionId===filters.collectionId)
    &&row.item.status!=="Review"
    &&!/verify|unknown/i.test(row.item.vitola)
    &&valuationNeedsMonitoring(row.item,valuations)
  );
  const deferredCount=intelligence.reviewQueue.length-completionQueue.length;

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
      <aside className="marketTrust"><div><TrustMark kind="Expert" compact/><span>Linked retailer, publication, or auction evidence</span></div><div><TrustMark kind="AI" compact/><span>AI-assisted source finding and normalization</span></div><a href="/trust">Understand the evidence labels →</a></aside>
      <section className="valueEvidenceStandard" aria-labelledby="value-evidence-standard">
        <header><div className="eyebrow">The New World evidence standard</div><h2 id="value-evidence-standard">Precision must be earned.</h2><p>The record states only what the evidence proves. A listing is useful—but it is not a sale.</p></header>
        <div>
          <article><span>01</span><h3>Retail replacement</h3><p>Current exact-cigar price from a manufacturer or established retailer.</p></article>
          <article><span>02</span><h3>{marketAskingPriceLabel}</h3><p>A public secondary listing, documented with its observation date and source. It is never presented as a completed sale.</p></article>
          <article><span>03</span><h3>Verified completed sale</h3><p>Exact identity, sold status, date, venue, quantity, and direct proof.</p></article>
          <article><span>04</span><h3>Estimated market range</h3><p>At least two independent secondary signals; shown as a range, not false precision.</p></article>
          <article><span>05</span><h3>Insufficient evidence</h3><p>The trusted answer when the public market cannot support a defensible value.</p></article>
        </div>
      </section>
      <SignalLegend />
      {filters.collectionId&&<section className="collectionValuationScope"><div><div className="eyebrow">Collection completion</div><h2>{completionQueue.length} component lot{completionQueue.length===1?"":"s"} still need value work</h2><p>This workspace is limited to the selected collection. Exact-match evidence is reused first; uncertain prices remain visibly pending.</p></div><a className="button secondary" href={`/collections/${encodeURIComponent(filters.collectionId)}`}>Back to collection</a></section>}
      <ValuationCompletionPanel items={completionQueue.map(row=>row.item)} mode={mode} deferredCount={deferredCount}/>
      <RetailPricingControls items={scopedInventory} mode={mode} initialInventoryId={filters.inventoryId} />
      <ValuationResearchPanel items={completionQueue.map((row)=>row.item)} mode={mode}/>

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
                        row.latest?.askingPrice === undefined ? <><strong>Insufficient evidence</strong><small>No defensible aftermarket value</small></> : <><strong>{unitMoney.format(row.latest.askingPrice)}</strong><small>{marketAskingPriceLabel}{row.latest.askingPriceSource ? ` · ${row.latest.askingPriceSource}` : ""}</small></>
                      ) : (
                        <>
                          {unitMoney.format(row.marketUnit)}
                          <small>{marketRangeText(row.latest) || row.latest?.valuationDate}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {row.marketLot === undefined
                        ? "—"
                        : money.format(row.marketLot)}
                    </td>
                    <td>{row.latestVerifiedSale ? <>{unitMoney.format(row.latestVerifiedSale.lastSaleValue!)}<small>{row.latestVerifiedSale.lastSaleDate}{row.latestVerifiedSale.lastSaleVenue ? ` · ${row.latestVerifiedSale.lastSaleVenue}` : ""}</small><a className="textLink" href={row.latestVerifiedSale.lastSaleSourceUrl} target="_blank" rel="noreferrer">Proof ↗</a></> : row.latestLegacySaleClaim ? <>{row.latestLegacySaleClaim.lastSaleValue === undefined ? "—" : unitMoney.format(row.latestLegacySaleClaim.lastSaleValue)}<small>{completedSaleLabel(row.latestLegacySaleClaim)}</small></> : "—"}</td>
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
                      <small>{row.evidenceType}</small>
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
