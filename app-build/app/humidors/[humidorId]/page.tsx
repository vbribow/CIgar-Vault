import { notFound } from "next/navigation";
import { accountDataMode } from "@/lib/user-data";
import { humidorInsights } from "@/lib/humidor-insights";
import { loadInventory } from "@/lib/inventory";
import { loadHumidorReadings, loadHumidors } from "@/lib/data";
import { climateIntelligence } from "@/lib/climate-intelligence";
import { brand } from "@/lib/brand";
import "../humidors.css";
import "./detail.css";
export const dynamic = "force-dynamic";
const one = (value: number | undefined, suffix: string) =>
  value === undefined ? "—" : `${value.toFixed(1)}${suffix}`;
export default async function HumidorDetailPage({
  params,
}: {
  params: Promise<{ humidorId: string }>;
}) {
  const { humidorId } = await params;
  const [modeResult, humidorsResult, readingsResult, inventoryResult] =
    await Promise.allSettled([
      accountDataMode(),
      loadHumidors(),
      loadHumidorReadings(),
      loadInventory(),
    ]);
  if (
    modeResult.status !== "fulfilled" ||
    humidorsResult.status !== "fulfilled" ||
    readingsResult.status !== "fulfilled" ||
    inventoryResult.status !== "fulfilled"
  ) {
    return (
      <main className="shell">
        <nav className="nav">
          <a className="brand" href="/">{brand.name}</a>
          <div className="navLinks"><a href="/humidors">← Humidors</a></div>
        </nav>
        <section className="card humidorDetailUnavailable">
          <div className="eyebrow">Climate record protected</div>
          <h1>This humidor is temporarily unavailable.</h1>
          <p>
            {brand.name} could not safely load its configuration, readings, and
            stored inventory together. The humidor has not been classified as
            missing, stable, or empty.
          </p>
        </section>
      </main>
    );
  }
  const mode = modeResult.value;
  const humidors = mode === "mock" ? [] : humidorsResult.value;
  const readings = mode === "mock" ? [] : readingsResult.value;
  const inventory = inventoryResult.value;
  const humidor = humidors.find((h) => h.humidorId === humidorId);
  if (!humidor) notFound();
  const insight = humidorInsights(humidor, readings);
  const intelligence = climateIntelligence(humidor, readings);
  const members = inventory.filter((i) => i.storageLocationId === humidorId);
  const quantityKnown = members.filter(i=>i.currentQty!==undefined);
  const quantity = quantityKnown.reduce((n, i) => n + i.currentQty!, 0);
  const valuedMembers=members.filter(i=>i.retailValue!==undefined&&i.currentQty!==undefined);
  const value = valuedMembers.reduce(
    (n, i) => n + i.retailValue! * i.currentQty!,
    0,
  );
  const quantityComplete=quantityKnown.length===members.length;
  const valueComplete=valuedMembers.length===members.length;
  const chart = [...insight.rows].reverse().slice(-30);
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          {brand.name}
        </a>
        <div className="navLinks">
          <a href="/humidors">← Humidors</a>
          <span className="badge">Climate intelligence</span>
        </div>
      </nav>
      <section className="detailClimateHero">
        <div>
          <div className="eyebrow">
            {intelligence.profile.label} profile · {humidor.type || "Humidor"} ·{" "}
            {humidor.location || "Location not set"}
          </div>
          <h1>{humidor.name}</h1>
          <p className="lede">
            {insight.rows.length
              ? `${insight.rows.length} readings analyzed against your selected ranges.`
              : "Add readings to begin climate analysis."}
          </p>
        </div>
        <div
          className={`stabilityDial ${(insight.stability ?? 0) < 80 ? "attention" : ""}`}
        >
          <strong>
            {insight.stability ?? "—"}
            {insight.stability !== undefined && "%"}
          </strong>
          <span>readings in range</span>
        </div>
      </section>
      <section className="detailClimateMetrics">
        <article>
          <span>Latest temperature</span>
          <strong>{one(insight.latest?.temperatureF, "°F")}</strong>
          <small>
            Target {humidor.targetTempF}° · range {humidor.minTempF}–
            {humidor.maxTempF}°
          </small>
        </article>
        <article>
          <span>Latest humidity</span>
          <strong>{one(insight.latest?.humidity, "%")}</strong>
          <small>
            Target {humidor.targetHumidity}% · range {humidor.minHumidity}–
            {humidor.maxHumidity}%
          </small>
        </article>
        <article>
          <span>Capacity</span>
          <strong>
            {quantityComplete?quantity:`At least ${quantity}`}
            {quantityComplete&&humidor.capacity ? ` / ${humidor.capacity}` : ""}
          </strong>
          <small>
            {!quantityComplete
              ? `${members.length-quantityKnown.length} lot${members.length-quantityKnown.length===1?"":"s"} need quantity`
              : humidor.capacity
              ? `${Math.round((quantity / humidor.capacity) * 100)}% occupied`
              : "Capacity not set"}
          </small>
        </article>
        <article>
          <span>Stored value</span>
          <strong>
            {valueComplete?`$${value.toLocaleString(undefined,{maximumFractionDigits:0})}`:valuedMembers.length?`$${value.toLocaleString(undefined,{maximumFractionDigits:0})} documented`:"Valuation pending"}
          </strong>
          <small>{valuedMembers.length} of {members.length} inventory lots valued</small>
        </article>
      </section>
      <section className="climateContextLink">
        <div><div className="eyebrow">Interpret this environment</div><strong>One reading is a moment. The trend is the climate.</strong><p>Compare this humidor’s selected targets with New World and official Habanos guidance, then learn what sustained heat, dryness, or excess moisture can do over time.</p></div>
        <a className="button secondary" href="/learn/humidor-climate">Open climate education</a>
      </section>
      <section className={`climateStewardship ${intelligence.sustained?"sustained":""}`}>
        <div className="stewardshipLead"><div className="eyebrow">Climate stewardship · {intelligence.profile.authority}</div><h2>{intelligence.state}</h2><p>{intelligence.summary}</p>{intelligence.consequence&&<blockquote>{intelligence.consequence}</blockquote>}{intelligence.action&&<div className="recommendedAction"><span>Recommended response</span><strong>{intelligence.action}</strong></div>}</div>
        <div className="exposureLedger">
          <div><span>Warm exposure</span><strong>{intelligence.exposureHours.tooWarm}h</strong><small>Estimated from observed readings</small></div>
          <div><span>Dry exposure</span><strong>{intelligence.exposureHours.tooDry}h</strong><small>Estimated from observed readings</small></div>
          <div><span>Humid exposure</span><strong>{intelligence.exposureHours.tooHumid}h</strong><small>Estimated from observed readings</small></div>
          <div><span>Current streak</span><strong>{intelligence.consecutiveReadings}</strong><small>Consecutive observed exceptions</small></div>
        </div>
        <small className="exposureMethod">Exposure estimates cap gaps between readings so sparse manual logs are not presented as continuous sensor evidence.</small>
      </section>
      <section className="climateAnalytics">
        <article className="card trendPanel">
          <div className="sectionHead">
            <div>
              <div className="eyebrow">Recent readings</div>
              <h2>Climate trend</h2>
            </div>
            <span className="small">Oldest → newest</span>
          </div>
          {chart.length ? (
            <>
              <div className="trendLegend">
                <span>
                  <i className="tempDot" />
                  Temperature
                </span>
                <span>
                  <i className="humidityDot" />
                  Humidity
                </span>
              </div>
              <div className="trendPlot">
                {chart.map((r) => (
                  <div
                    className="trendPair"
                    key={r.readingId}
                    title={`${r.recordedAt}: ${r.temperatureF}°F, ${r.humidity}%`}
                  >
                    <i
                      className="tempBar"
                      style={{
                        height: `${Math.max(8, Math.min(100, ((r.temperatureF - 40) / 50) * 100))}%`,
                      }}
                    />
                    <i
                      className="humidityBar"
                      style={{
                        height: `${Math.max(8, Math.min(100, ((r.humidity - 30) / 60) * 100))}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="trendStats">
                <span>
                  Temperature{" "}
                  <strong>
                    {one(insight.minTemp, "°")}–{one(insight.maxTemp, "°")}
                  </strong>
                </span>
                <span>
                  Average <strong>{one(insight.averageTemp, "°F")}</strong>
                </span>
                <span>
                  Humidity{" "}
                  <strong>
                    {one(insight.minHumidity, "%")}–
                    {one(insight.maxHumidity, "%")}
                  </strong>
                </span>
                <span>
                  Average <strong>{one(insight.averageHumidity, "%")}</strong>
                </span>
              </div>
            </>
          ) : (
            <div className="emptyState">No readings yet.</div>
          )}
        </article>
        <article className="card alertPanel">
          <div className="eyebrow">Exceptions</div>
          <h2>{insight.excursions.length} range excursions</h2>
          {insight.excursions.slice(0, 8).map((r) => (
            <div className="excursion" key={r.readingId}>
              <div>
                <strong>
                  {r.temperatureF}°F · {r.humidity}%
                </strong>
                <small>{r.recordedAt.replace("T", " ")}</small>
              </div>
              <span>
                {r.temperatureF < humidor.minTempF
                  ? "Too cool"
                  : r.temperatureF > humidor.maxTempF
                    ? "Too warm"
                    : r.humidity < humidor.minHumidity
                      ? "Too dry"
                      : "Too humid"}
              </span>
            </div>
          ))}
          {!insight.excursions.length && (
            <p className="stableMessage">
              Every recorded reading is inside your selected ranges.
            </p>
          )}
          <a className="button secondary" href="/humidors">
            Record another reading
          </a>
        </article>
      </section>
      <section className="section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Stored inventory</div>
            <h2>{members.length} lots in this humidor</h2>
          </div>
          <a className="textLink" href="/inventory">
            Manage inventory →
          </a>
        </div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Cigar</th>
                <th>Vintage</th>
                <th>Quantity</th>
                <th>Unit value</th>
                <th>Lot value</th>
              </tr>
            </thead>
            <tbody>
              {members.map((i) => (
                <tr key={i.inventoryId}>
                  <td>
                    <a href={`/inventory/${i.inventoryId}`}>
                      <strong>
                        {i.brand} {i.line}
                      </strong>
                      <div className="small">{i.vitola}</div>
                    </a>
                  </td>
                  <td>{i.vintage || "—"}</td>
                  <td>{i.currentQty ?? "—"}</td>
                  <td>
                    {i.retailValue === undefined
                      ? "—"
                      : `$${i.retailValue.toFixed(2)}`}
                  </td>
                  <td>
                    {i.retailValue === undefined || i.currentQty === undefined
                      ? "—"
                      : `$${(i.retailValue * i.currentQty).toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
