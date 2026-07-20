import { InventoryItem } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export function Dashboard({ items }: { items: InventoryItem[] }) {
  const knownQty = items.reduce((sum, item) => sum + (item.currentQty || 0), 0);
  const value = items.reduce((sum, item) => sum + (item.retailValue || 0), 0);
  const scored = items.filter((item) => typeof item.score === "number");
  const avg = scored.length ? scored.reduce((sum, item) => sum + (item.score || 0), 0) / scored.length : 0;
  const featured = [...items].sort((a,b) => (b.score || 0) - (a.score || 0)).slice(0,8);
  return <>
    <div className="grid">
      <div className="card"><div className="metric">{items.length}</div><div className="label">Inventory lots</div></div>
      <div className="card"><div className="metric">{knownQty}</div><div className="label">Known cigars remaining</div></div>
      <div className="card"><div className="metric">{money.format(value)}</div><div className="label">Known replacement value</div></div>
      <div className="card"><div className="metric">{avg.toFixed(1)}</div><div className="label">Average recorded score</div></div>
    </div>
    <section className="section"><div className="sectionHead"><div><h2>Collection highlights</h2><div className="small">Smartsheet-backed inventory intelligence</div></div><a className="button secondary" href="/inventory">View inventory</a></div>
      <div className="tableWrap"><table className="table"><thead><tr><th>Cigar</th><th>Vintage</th><th>Remaining</th><th>Score</th><th>Action</th></tr></thead><tbody>
        {featured.map(item => <tr key={item.inventoryId}><td><strong>{item.brand}</strong><div className="small">{item.line} · {item.vitola}</div></td><td>{item.vintage || "—"}</td><td>{item.currentQty ?? "—"}</td><td>{item.score ?? "—"}</td><td className="status">{item.action || item.status || "Review"}</td></tr>)}
      </tbody></table></div>
    </section>
  </>;
}
