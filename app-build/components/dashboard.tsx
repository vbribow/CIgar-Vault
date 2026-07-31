import { InventoryItem } from "@/lib/types";
import { lotRetailValue } from "@/lib/valuation";
import type { OnboardingStep } from "@/lib/onboarding";
import { OnboardingDashboard } from "./onboarding-dashboard";
import type { buildCollectionIntelligence } from "@/lib/collection-intelligence";
import { CollectorCommandCenter } from "./collector-command-center";
import { productDomains } from "@/lib/product-domains";
import { isActiveInventoryHolding, isCurrentInventoryRecord } from "@/lib/inventory-model";
import { brand } from "@/lib/brand";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export function Dashboard({ items, onboarding,intelligence }: { items: InventoryItem[]; onboarding: OnboardingStep[];intelligence:ReturnType<typeof buildCollectionIntelligence> }) {
  const current = items.filter(isCurrentInventoryRecord);
  const active = current.filter(isActiveInventoryHolding);
  const knownQty = active.reduce((sum, item) => sum + (item.currentQty || 0), 0);
  const value = active.reduce((sum, item) => sum + (lotRetailValue(item) || 0), 0);
  const scored = active.filter((item) => typeof item.score === "number");
  const avg = scored.length ? scored.reduce((sum, item) => sum + (item.score || 0), 0) / scored.length : 0;
  const featured = [...active].sort((a,b) => (b.score || 0) - (a.score || 0)).slice(0,8);
  const valued = active.filter((item) => typeof item.retailValue === "number").length;
  const statuses = current.reduce<Record<string, number>>((counts, item) => { const key=item.status||"Review"; counts[key]=(counts[key]||0)+1; return counts; },{});
  const maxStatus = Math.max(...Object.values(statuses),1);
  const aging = active.filter((item) => item.status === "Hold" || item.status === "Preserve").sort((a,b)=>(a.vintage?Number(a.vintage):9999)-(b.vintage?Number(b.vintage):9999)).slice(0,3);
  if (!current.length) return <>
    <section className="card firstSessionWelcome" aria-labelledby="first-session-title">
      <div><div className="eyebrow">Your first ten minutes</div><h2 id="first-session-title">Begin with one cigar you know.</h2><p>You do not need to catalog everything today. One accurate record is enough for {brand.name} to begin protecting its identity, story, and care.</p></div>
      <div className="firstSessionSteps" aria-label="First collection steps">
        <article><span>01</span><strong>Document one cigar</strong><small>Start with the band, box, or details already in front of you.</small></article>
        <article><span>02</span><strong>Preserve what you know</strong><small>Add quantity, provenance, and authenticity evidence without guessing.</small></article>
        <article><span>03</span><strong>See the first insight</strong><small>Return home to see what is documented and what deserves attention next.</small></article>
      </div>
      <div className="ctaRow"><a className="button" href="/inventory#mobile-intake">Document my first cigar</a><a className="button secondary" href="/collector-walkthrough">Practice with a synthetic example</a></div>
      <small className="firstSessionAssurance">Private by default · You remain in control · Uncertain details can stay blank</small>
    </section>
    <OnboardingDashboard steps={onboarding} />
  </>;
  return <>
    <CollectorCommandCenter intelligence={intelligence} />
    <div className="grid">
      <div className="card"><div className="metric">{current.length}</div><div className="label">Current inventory records</div></div>
      <div className="card"><div className="metric">{knownQty}</div><div className="label">Known cigars remaining</div></div>
      <div className="card"><div className="metric">{money.format(value)}</div><div className="label">Documented retail replacement subtotal · unit retail × remaining quantity · {valued}/{active.length} active lots priced</div></div>
      <div className="card"><div className="metric">{avg.toFixed(1)}</div><div className="label">Average recorded score</div></div>
    </div>
    <section className="dashboardIntelligence"><a className="dashboardScore" href="/intelligence"><span>Collection understanding</span><strong>{intelligence.score}</strong><small>Eight connected intelligence dimensions →</small></a><article><div className="eyebrow">Cigar Somm · Powered by {brand.name} AI</div><h2>{intelligence.advisor.smokeNow[0]?`${intelligence.advisor.smokeNow[0].brand} ${intelligence.advisor.smokeNow[0].line}`:"Ask what to smoke or pair"}</h2><p>{intelligence.advisor.smokeNow[0]?`${intelligence.advisor.smokeNow[0].vitola} is ready for a tasting profile and complete pairing plan.`:"Explore coffee, spirits, cocktails, nonalcoholic pairings, and smoking-window guidance."}</p><a href="/cigar-somm">Open Cigar Somm →</a></article><article><div className="eyebrow">Market movement · Dated evidence</div><h2>{intelligence.advisor.appreciating[0]?`+${intelligence.advisor.appreciating[0].changePercent}% documented`:"No unproven claims"}</h2><p>{intelligence.advisor.appreciating[0]?`${intelligence.advisor.appreciating[0].item.brand} ${intelligence.advisor.appreciating[0].item.line} leads measured appreciation.`:`${brand.name} waits for two dated valuations before reporting appreciation.`}</p><a href="/value-history">Understand market history →</a></article><article><div className="eyebrow">Collector DNA · {intelligence.dna.confidence}</div><h2>{intelligence.dna.topBrands.join(" · ")||"Taste profile developing"}</h2><p>{intelligence.dna.tastings} recorded tasting{intelligence.dna.tastings===1?"":"s"} currently shape personalized guidance.</p><a href="/records">Strengthen the profile →</a></article></section>
    <OnboardingDashboard steps={onboarding} />
    <section className="section featureMap"><div className="sectionHead"><div><div className="eyebrow">One connected {brand.name}</div><h2>Begin with what you want to accomplish.</h2><p className="small">Nine collector-centered domains share the same private collection, knowledge, and evidence.</p></div><a className="button secondary" href="/explore">Explore {brand.name}</a></div>
      <div className="featurePillars">
        {productDomains.map((domain,index)=><article key={domain.id}><span className="pillarNumber">{String(index+1).padStart(2,"0")}</span><h3>{domain.label}</h3><p>{domain.promise}</p><div><a href={domain.href}>Enter {domain.label} →</a></div></article>)}
      </div>
    </section>
    <section className="automationStrip"><div><div className="eyebrow">Background intelligence</div><h2>Research continues between visits.</h2><a className="textLink" href="/briefing">Open today’s {brand.name} Briefing →</a></div><div className="automationList"><span><b>Daily</b> collector briefing</span><span><b>Weekly</b> catalog discovery</span><span><b>Daily</b> wishlist monitoring</span><span><b>Weekly</b> valuation review</span><span><b>Hourly</b> configured sensor sync</span></div><small>Automations run when their required services and credentials are configured. Briefing recommendations always expose their evidence and source type.</small></section>
    <section className="section"><div className="sectionHead"><div><h2>Collection highlights</h2><div className="small">Highest-scored cigars currently in the vault</div></div><a className="button secondary" href="/inventory">View inventory</a></div>
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
