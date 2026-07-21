import { InventoryItem } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export function Dashboard({ items }: { items: InventoryItem[] }) {
  const knownQty = items.reduce((sum, item) => sum + (item.currentQty || 0), 0);
  const value = items.reduce((sum, item) => sum + (item.retailValue || 0), 0);
  const scored = items.filter((item) => typeof item.score === "number");
  const avg = scored.length ? scored.reduce((sum, item) => sum + (item.score || 0), 0) / scored.length : 0;
  const featured = [...items].sort((a,b) => (b.score || 0) - (a.score || 0)).slice(0,8);
  const valued = items.filter((item) => typeof item.retailValue === "number").length;
  const statuses = items.reduce<Record<string, number>>((counts, item) => { const key=item.status||"Review"; counts[key]=(counts[key]||0)+1; return counts; },{});
  const maxStatus = Math.max(...Object.values(statuses),1);
  const aging = items.filter((item) => item.status === "Hold" || item.status === "Preserve").sort((a,b)=>(a.vintage?Number(a.vintage):9999)-(b.vintage?Number(b.vintage):9999)).slice(0,3);
  return <>
    <div className="grid">
      <div className="card"><div className="metric">{items.length}</div><div className="label">Inventory lots</div></div>
      <div className="card"><div className="metric">{knownQty}</div><div className="label">Known cigars remaining</div></div>
      <div className="card"><div className="metric">{money.format(value)}</div><div className="label">Known replacement value · {valued}/{items.length} valued</div></div>
      <div className="card"><div className="metric">{avg.toFixed(1)}</div><div className="label">Average recorded score</div></div>
    </div>
    <section className="section"><div className="sectionHead"><div><h2>Collection highlights</h2><div className="small">Smartsheet-backed inventory intelligence</div></div><a className="button secondary" href="/inventory">View inventory</a></div>
      <div className="tableWrap"><table className="table"><thead><tr><th>Cigar</th><th>Vintage</th><th>Remaining</th><th>Score</th><th>Action</th></tr></thead><tbody>
        {featured.map(item => <tr key={item.inventoryId}><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand}</strong><div className="small">{item.line} · {item.vitola}</div></a></td><td>{item.vintage || "—"}</td><td>{item.currentQty ?? "—"}</td><td>{item.score ?? "—"}</td><td className="status">{item.action || item.status || "Review"}</td></tr>)}
      </tbody></table></div>
    </section>
    <section className="insightGrid">
      <article className="card"><div className="eyebrow">Collection balance</div><h2>How the vault is positioned</h2><div className="barList">{Object.entries(statuses).sort((a,b)=>b[1]-a[1]).map(([name,count])=><div key={name}><div className="barMeta"><span>{name}</span><strong>{count}</strong></div><div className="barTrack"><i style={{width:`${count/maxStatus*100}%`}} /></div></div>)}</div></article>
      <article className="card"><div className="eyebrow">Cellar watch</div><h2>Hold with intention</h2><div className="watchList">{aging.map(item=><a key={item.inventoryId} href={`/inventory/${item.inventoryId}`}><span className="scoreRing">{item.score??"—"}</span><span><strong>{item.brand} {item.line}</strong><small>{item.vintage||"Undated"} · {item.action||item.status}</small></span><b>→</b></a>)}</div></article>
    </section>
  </>;
}
