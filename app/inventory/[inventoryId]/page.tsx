import { notFound } from "next/navigation";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadActivities, loadSmokingLogs, loadValuations } from "@/lib/data";
import { PhotoManager } from "@/components/photo-manager";
export const dynamic = "force-dynamic";
export default async function CigarPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>;
}) {
  const { inventoryId } = await params;
  const items = await loadInventory();
  const item = items.find((i) => i.inventoryId === inventoryId);
  if (!item) notFound();
  const mode = await accountDataMode();
  const [smokes, valuations, activities] =
    mode === "mock"
      ? [[], [], []]
      : await Promise.all([loadSmokingLogs(), loadValuations(), loadActivities()]);
  const history = smokes.filter((s) => s.inventoryId === inventoryId);
  const values = valuations.filter((v) => v.inventoryId === inventoryId);
  const events = activities.filter((a) => a.inventoryId === inventoryId);
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          Cigar Vault
        </a>
        <a className="backLink" href="/inventory">
          ← Collection
        </a>
      </nav>
      <section className="detailHero">
        <div>
          <div className="eyebrow">
            {item.inventoryId} · {item.status || "Review"}
          </div>
          <h1>{item.brand}</h1>
          <p>{item.line}</p>
          <span>
            {item.vitola}
            {item.vintage ? ` · ${item.vintage}` : ""}
          </span>
        </div>
        <div className="scoreCard">
          <small>Vault score</small>
          <strong>{item.score ?? "—"}</strong>
          <span>{item.priority || "Unrated priority"}</span>
        </div>
      </section>
      <section className="detailStats">
        <div>
          <span>Remaining</span>
          <strong>{item.currentQty ?? "—"}</strong>
        </div>
        <div>
          <span>Original</span>
          <strong>{item.originalQty ?? "—"}</strong>
        </div>
        <div>
          <span>Replacement</span>
          <strong>
            {item.retailValue ? `$${item.retailValue.toLocaleString()}` : "—"}
          </strong>
        </div>
        <div>
          <span>Storage</span>
          <strong>{item.storageLocationId || "Not set"}</strong>
        </div>
      </section>
      <section className="detailGrid">
        <article className="card">
          <div className="eyebrow">Collector direction</div>
          <h2>{item.action || "Review this cigar"}</h2>
          <p className="small">
            {item.provenanceNotes ||
              item.notes ||
              "Add provenance and tasting context to make this recommendation more useful."}
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Smoking history</div>
          <h2>{history.length} recorded</h2>
          {history.slice(0, 3).map((s) => (
            <p key={s.smokeId} className="historyRow">
              <span>{s.dateSmoked}</span>
              <strong>{s.overall ?? "—"}</strong>
            </p>
          ))}
          {!history.length && <p className="small">No smokes logged yet.</p>}
          <a className="textLink" href="/records">
            Add tasting note →
          </a>
        </article>
        <article className="card">
          <div className="eyebrow">Valuation history</div>
          <h2>{values.length} recorded</h2>
          {values.slice(0, 3).map((v) => (
            <p key={v.valuationId} className="historyRow">
              <span>{v.valuationDate}</span>
              <strong>${v.marketValue ?? v.replacementValue ?? 0}</strong>
            </p>
          ))}
          {!values.length && <p className="small">No dated valuations yet.</p>}
          <a className="textLink" href="/records">
            Add valuation →
          </a>
        </article>
      </section>
      <section className="section card">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Activity ledger</div>
            <h2>{events.length} events</h2>
          </div>
          <a
            className="button secondary"
            href={`/activity?inventoryId=${item.inventoryId}`}
          >
            Record activity
          </a>
        </div>
        {events.slice(0, 5).map((event) => (
          <p className="historyRow" key={event.activityId}>
            <span>
              {event.eventDate} · {event.eventType}
            </span>
            <strong>{event.resultingQuantity ?? "—"} remaining</strong>
          </p>
        ))}
        {!events.length && (
          <p className="small">
            No activity recorded yet. Start with a purchase, count correction,
            or storage move.
          </p>
        )}
      </section>
      <PhotoManager item={item} />
    </main>
  );
}
