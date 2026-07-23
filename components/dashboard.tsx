import { InventoryItem } from "@/lib/types";
import { lotRetailValue } from "@/lib/valuation";
import type { OnboardingStep } from "@/lib/onboarding";
import { OnboardingDashboard } from "./onboarding-dashboard";
import type { buildCollectionIntelligence } from "@/lib/collection-intelligence";
import { CollectorCommandCenter } from "./collector-command-center";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export function Dashboard({ items, onboarding,intelligence }: { items: InventoryItem[]; onboarding: OnboardingStep[];intelligence:ReturnType<typeof buildCollectionIntelligence> }) {
  const knownQty = items.reduce((sum, item) => sum + (item.currentQty || 0), 0);
  const value = items.reduce((sum, item) => sum + (lotRetailValue(item) || 0), 0);
  const scored = items.filter((item) => typeof item.score === "number");
  const avg = scored.length ? scored.reduce((sum, item) => sum + (item.score || 0), 0) / scored.length : 0;
  const featured = [...items].sort((a,b) => (b.score || 0) - (a.score || 0)).slice(0,8);
  const valued = items.filter((item) => typeof item.retailValue === "number").length;
  const statuses = items.reduce<Record<string, number>>((counts, item) => { const key=item.status||"Review"; counts[key]=(counts[key]||0)+1; return counts; },{});
  const maxStatus = Math.max(...Object.values(statuses),1);
  const aging = items.filter((item) => item.status === "Hold" || item.status === "Preserve").sort((a,b)=>(a.vintage?Number(a.vintage):9999)-(b.vintage?Number(b.vintage):9999)).slice(0,3);
  return <>
    <CollectorCommandCenter intelligence={intelligence} />
    <div className="grid">
      <div className="card"><div className="metric">{items.length}</div><div className="label">Inventory lots</div></div>
      <div className="card"><div className="metric">{knownQty}</div><div className="label">Known cigars remaining</div></div>
      <div className="card"><div className="metric">{money.format(value)}</div><div className="label">Documented retail replacement subtotal · unit retail × remaining quantity · {valued}/{items.length} lots priced</div></div>
      <div className="card"><div className="metric">{avg.toFixed(1)}</div><div className="label">Average recorded score</div></div>
    </div>
    <section className="dashboardIntelligence"><a className="dashboardScore" href="/intelligence"><span>Collection Score</span><strong>{intelligence.score}</strong><small>Eight connected intelligence dimensions →</small></a><article><div className="eyebrow">Cigar Somm</div><h2>{intelligence.advisor.smokeNow[0]?`${intelligence.advisor.smokeNow[0].brand} ${intelligence.advisor.smokeNow[0].line}`:"Ask what to smoke or pair"}</h2><p>{intelligence.advisor.smokeNow[0]?`${intelligence.advisor.smokeNow[0].vitola} is a dated candidate to discuss with your personal advisor.`:"Explore coffee, spirits, nonalcoholic pairings, and smoking-window guidance."}</p><a href="/cigar-somm">Ask Cigar Somm →</a></article><article><div className="eyebrow">Market movement</div><h2>{intelligence.advisor.appreciating[0]?`+${intelligence.advisor.appreciating[0].changePercent}% documented`:"No unproven claims"}</h2><p>{intelligence.advisor.appreciating[0]?`${intelligence.advisor.appreciating[0].item.brand} ${intelligence.advisor.appreciating[0].item.line} leads measured appreciation.`:"Cedriva waits for two dated valuations before reporting appreciation."}</p><a href="/value-history">Review portfolio history →</a></article><article><div className="eyebrow">Collector DNA · {intelligence.dna.confidence}</div><h2>{intelligence.dna.topBrands.join(" · ")||"Taste profile developing"}</h2><p>{intelligence.dna.tastings} recorded tasting{intelligence.dna.tastings===1?"":"s"} currently shape personalized guidance.</p><a href="/records">Strengthen the profile →</a></article></section>
    <OnboardingDashboard steps={onboarding} />
    <section className="section featureMap"><div className="sectionHead"><div><div className="eyebrow">Everything in Cedriva</div><h2>One collection. Five connected systems.</h2><p className="small">Start with the job you need to do; every tool works from the same inventory record.</p></div></div>
      <div className="featurePillars">
        <article><span className="pillarNumber">01</span><h3>Inventory & provenance</h3><p>Track boxes, loose cigars, photos, documents, box codes, verification, location, and every quantity-changing event.</p><div><a href="/inventory">Manage inventory →</a><a href="/inventory-integrity">Protect the records →</a></div></article>
        <article><span className="pillarNumber">02</span><h3>Collectible sets</h3><p>Build custom or researched collections, match owned components, value the complete presentation, and plan what is missing.</p><div><a href="/collections">Open collections →</a><a href="/acquisitions">Plan acquisitions →</a></div></article>
        <article><span className="pillarNumber">03</span><h3>Value & documentation</h3><p>Research per-cigar pricing, preserve market evidence, follow portfolio history, and generate an insurance-ready schedule.</p><div><a href="/valuations">Review values →</a><a href="/reports">Create report →</a></div></article>
        <article><span className="pillarNumber">04</span><h3>Climate protection</h3><p>Set humidor targets, connect supported sensor data, monitor stored value, and keep a record of climate warnings.</p><div><a href="/humidors">View humidors →</a><a href="/sensors">Manage sensors →</a></div></article>
        <article><span className="pillarNumber">05</span><h3>Collector planning</h3><p>Maintain a wishlist, research availability, monitor target prices, convert purchases, and keep a tasting journal.</p><div><a href="/wishlist">Open wishlist →</a><a href="/records">Open journal →</a></div></article>
      </div>
    </section>
    <section className="automationStrip"><div><div className="eyebrow">Background intelligence</div><h2>Research continues between visits.</h2></div><div className="automationList"><span><b>Weekly</b> catalog discovery</span><span><b>Daily</b> wishlist monitoring</span><span><b>Weekly</b> valuation review</span><span><b>Hourly</b> configured sensor sync</span></div><small>Automations run when their required services and credentials are configured.</small></section>
    <section className="section"><div className="sectionHead"><div><h2>Collection highlights</h2><div className="small">Highest-scored lots in the current inventory</div></div><a className="button secondary" href="/inventory">View inventory</a></div>
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
