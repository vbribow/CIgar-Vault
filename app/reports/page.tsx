import { ReportActions } from "@/components/report-actions";
import { accountDataMode } from "@/lib/user-data";
import { buildInsuranceReport } from "@/lib/insurance-report";
import { loadInventory } from "@/lib/inventory";
import { loadHumidorReadings, loadHumidors, loadSensors } from "@/lib/data";
import "./reports.css";
import { ProductEvent } from "@/components/product-event";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { UpgradeNudge } from "@/components/upgrade-nudge";

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

export default async function ReportsPage() {
  const mode = await accountDataMode();
  const plan = await loadAccountPlan();
  const live = mode !== "mock";
  const [inventory, humidors, readings, sensors] = await Promise.all([
    loadInventory(),
    live ? loadHumidors() : Promise.resolve([]),
    live ? loadHumidorReadings() : Promise.resolve([]),
    live ? loadSensors() : Promise.resolve([]),
  ]);
  const report = buildInsuranceReport(inventory, humidors, readings, sensors);
  const exceptionEntries = [
    [
      "Missing current quantity",
      report.exceptions.missingQuantity,
      "/inventory-count",
    ],
    [
      "Missing replacement value",
      report.exceptions.missingValuation,
      "/valuations",
    ],
    ["Missing collection photo", report.exceptions.missingPhoto, "/inventory"],
    ["Missing provenance", report.exceptions.missingProvenance, "/inventory"],
    ["Unassigned storage", report.exceptions.unassignedStorage, "/storage"],
    [
      "Boxed Cuban lots needing verification",
      report.exceptions.cubanEvidenceNeeded,
      "/verification",
    ],
  ] as const;

  return (
    <main className="shell wideShell insuranceReport"><ProductEvent eventType="insurance-report-viewed" /><UpgradeNudge plan={plan} context="reports" />
      <section className="reportHero">
        <div>
          <div className="eyebrow">Collection protection</div>
          <h1>Insurance-ready collection report.</h1>
          <p className="lede">
            A current, evidence-backed schedule of your cigars, replacement
            values, provenance, and storage conditions.
          </p>
          <p className="reportMeta">
            Generated {new Date(report.generatedAt).toLocaleString()} ·{" "}
            {mode === "supabase" ? "Private account records" : live ? "Live Smartsheet records" : "Sample records"}
          </p>
        </div>
        <div>
          <ReportActions rows={report.rows} generatedAt={report.generatedAt} />
          <div className="reportValue">
            <span>Scheduled replacement value</span>
            <strong>
              {money.format(report.totals.scheduledReplacementValue)}
            </strong>
            <small>Known quantities × recorded unit values</small>
          </div>
        </div>
      </section>

      <section className="reportMetrics">
        <article>
          <span>Inventory lots</span>
          <strong>{report.totals.lots}</strong>
          <small>
            {report.totals.knownQuantity.toLocaleString()} cigars with known
            quantities
          </small>
        </article>
        <article>
          <span>Storage coverage</span>
          <strong>{report.totals.storageLocations}</strong>
          <small>assigned storage locations</small>
        </article>
        <article>
          <span>Unassigned value</span>
          <strong>{money.format(report.totals.unassignedValue)}</strong>
          <small>known value without a storage location</small>
        </article>
        <article className={report.totals.valueAtClimateRisk ? "risk" : ""}>
          <span>Climate exposure</span>
          <strong>{money.format(report.totals.valueAtClimateRisk)}</strong>
          <small>attention, critical, or unmonitored value</small>
        </article>
      </section>

      <section className="reportSection">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Evidence readiness</div>
            <h2>Documentation coverage</h2>
          </div>
          <a className="textLink" href="/collection-health">
            Improve collection data →
          </a>
        </div>
        <div className="coverageGrid">
          {[
            ["Quantity", report.coverage.quantity],
            ["Replacement value", report.coverage.valuation],
            ["Photos", report.coverage.photo],
            ["Provenance", report.coverage.provenance],
            ["Cuban verification", report.coverage.cubanVerification],
          ].map(([label, value]) => (
            <article key={label}>
              <div>
                <span>{label}</span>
                <strong>{value}%</strong>
              </div>
              <div className="reportMeter">
                <i style={{ width: `${value}%` }} />
              </div>
              {label === "Cuban verification" && (
                <small>
                  {report.coverage.boxedCubanLots} boxed Cuban lots in scope
                </small>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="reportSection">
        <div className="sectionHead"><div><div className="eyebrow">Data protection</div><h2>Inventory integrity</h2></div><a className="textLink" href="/inventory-integrity">Compare Smartsheet and account →</a></div>
        <p className="small">Detect missing records, quantity mismatches, duplicate IDs, and download a point-in-time inventory backup before making corrections.</p>
      </section>

      <section className="reportSection">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Storage evidence</div>
            <h2>Humidor climate snapshot</h2>
          </div>
          <a className="textLink" href="/humidors">
            Open climate command center →
          </a>
        </div>
        {report.climate.length ? (
          <div className="climateEvidence">
            {report.climate.map((item) => (
              <article
                key={item.humidorId}
                className={item.severity.toLowerCase()}
              >
                <div>
                  <span>{item.location}</span>
                  <strong>{item.name}</strong>
                </div>
                <b>{item.severity}</b>
                <p>
                  {item.temperatureF === undefined
                    ? "No current reading"
                    : `${item.temperatureF}°F · ${item.humidity}% RH`}
                </p>
                <small>
                  {money.format(item.storedValue)} stored · {item.evidence}
                  {item.recordedAt
                    ? ` · ${new Date(item.recordedAt).toLocaleString()}`
                    : ""}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">
            No configured humidors are available in this data set.
          </div>
        )}
      </section>

      <section className="reportSection reportExceptions">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Before submission</div>
            <h2>Evidence exceptions</h2>
          </div>
        </div>
        <div>
          {exceptionEntries.map(([label, count, href]) => (
            <a href={href} key={label} className={count ? "open" : "complete"}>
              <span>{label}</span>
              <strong>{count ? `${count} to resolve →` : "Complete ✓"}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="reportSection">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Property schedule</div>
            <h2>Itemized replacement value</h2>
          </div>
          <span className="small">Sorted by scheduled value</span>
        </div>
        <div className="tableWrap">
          <table className="table reportTable">
            <thead>
              <tr>
                <th>Inventory item</th>
                <th>Vintage / package</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Scheduled</th>
                <th>Storage</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.inventoryId}>
                  <td>
                    <a href={`/inventory/${row.inventoryId}`}>
                      <strong>{row.cigar}</strong>
                      <small>{row.inventoryId}</small>
                    </a>
                  </td>
                  <td>
                    {row.vintage}
                    <small>{row.packaging}</small>
                  </td>
                  <td>{row.quantity ?? "—"}</td>
                  <td>
                    {row.unitReplacement === undefined
                      ? "—"
                      : unitMoney.format(row.unitReplacement)}
                  </td>
                  <td>
                    <strong>
                      {row.scheduledValue === undefined
                        ? "—"
                        : money.format(row.scheduledValue)}
                    </strong>
                  </td>
                  <td>{row.storage}</td>
                  <td>
                    <span>{row.photo ? "Photo ✓" : "No photo"}</span>
                    <small>
                      {row.provenance ? "Provenance ✓" : "No provenance"} ·{" "}
                      {row.verification}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <footer className="reportDisclaimer">
        <strong>Important:</strong> This is a collection-management report
        generated from owner-maintained records. It is not an independent
        appraisal, an insurance binder, proof of ownership, or a guarantee of
        authenticity. Confirm required evidence and valuation standards with
        your insurer.
      </footer>
    </main>
  );
}
