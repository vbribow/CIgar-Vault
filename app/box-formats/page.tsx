import { boxFormats, findBoxFormat } from "@/lib/box-formats";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function BoxFormatsPage() {
  const inventory = await loadInventory();
  const matched = inventory.filter(findBoxFormat);
  const pending = inventory.filter((item) => !findBoxFormat(item));
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/valuations">Valuation</a><a href="/verification">Verification</a></div></nav>
    <section className="verifyHero"><div><div className="eyebrow">Packaging intelligence</div><h1>Boxes and sticks, counted correctly.</h1><p className="lede">Cigar Vault stores full boxes, cigars per box and loose sticks separately, then calculates the total number of cigars automatically.</p></div><div className="verifyScore"><strong>{matched.length}</strong><span>inventory lots matched</span><small>{pending.length} rare or ambiguous lots still need packaging confirmation</small></div></section>
    <section className="valueMetrics"><article><span>Format references</span><strong>{boxFormats.length}</strong><small>Sourced product-level formats</small></article><article><span>Matched lots</span><strong>{matched.length}</strong><small>Known format available</small></article><article><span>Research queue</span><strong>{pending.length}</strong><small>No assumptions made</small></article><article><span>Calculation</span><strong className="formula">boxes × size + loose</strong><small>Less recorded smoked quantity</small></article></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Sourced catalog</div><h2>Known box formats</h2></div><a className="button secondary" href="/inventory">Enter quantities</a></div><div className="tableWrap"><table className="table"><thead><tr><th>Brand</th><th>Cigar</th><th>Known box sizes</th><th>Source</th></tr></thead><tbody>{boxFormats.map((format)=><tr key={`${format.brand}-${format.product}`}><td><strong>{format.brand}</strong></td><td>{format.product}</td><td>{format.sizes.join(" or ")} cigars</td><td><a className="textLink" href={format.sourceUrl} target="_blank" rel="noreferrer">{format.sourceLabel} ↗</a></td></tr>)}</tbody></table></div></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Research queue</div><h2>Rare formats needing confirmation</h2></div></div><div className="researchGrid">{pending.map((item)=><a href={`/inventory/${item.inventoryId}`} key={item.inventoryId}><strong>{item.brand} {item.line}</strong><small>{item.inventoryId} · {item.vitola}</small></a>)}</div></section>
  </main>;
}
