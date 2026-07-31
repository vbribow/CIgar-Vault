import { cubanVerificationStatus, isCubanInventory } from "@/lib/cuban-verification";
import { loadInventory } from "@/lib/inventory";
import { brand } from "@/lib/brand";
import {
  HABANOS_AUTHENTICITY_URL,
  HABANOS_EVIDENCE_CAUTION,
  HABANOS_RETAIL_NETWORK_URL,
  OFAC_CUBAN_GOODS_URL,
} from "@/lib/habanos-protection";

export const dynamic = "force-dynamic";

const visibleStatus = (status: string) => status === "Verified" ? "Official lookup recorded" : status;

export default async function VerificationPage() {
  const cubans = (await loadInventory()).filter(isCubanInventory);
  const groups = {
    recorded: cubans.filter((item) => cubanVerificationStatus(item) === "Verified"),
    ready: cubans.filter((item) => cubanVerificationStatus(item) === "Ready to verify"),
    needed: cubans.filter((item) => ["Partial evidence", "Evidence needed"].includes(cubanVerificationStatus(item))),
    loose: cubans.filter((item) => cubanVerificationStatus(item) === "Loose sticks"),
  };

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/learn/habanos-authenticity">Authenticity guide</a><a href="/storage">Storage</a></div></nav>
    <section className="verifyHero"><div><div className="eyebrow">Habanos evidence</div><h1>Build a layered evidence record.</h1><p className="lede">Keep legality, seller/source, package evidence, the official lookup, and provenance distinct. No single clue proves the whole claim.</p><div className="verifyActions"><a className="button" href="/collector-walkthrough">Try the synthetic walkthrough</a><a className="button secondary" href={HABANOS_AUTHENTICITY_URL}>Open Habanos official lookup →</a><a className="button secondary" href="/inventory">Update inventory</a></div><p className="sourceReturnNote">Official sources open in this tab. Use your browser’s Back button to return to {brand.name}.</p></div><div className="verifyScore"><strong>{groups.recorded.length}</strong><span>official lookup results recorded</span><small>{groups.ready.length} lots ready for the official lookup</small></div></section>
    <section className="section card"><div className="eyebrow">Evidence boundary</div><h2>A matching result is not a complete authentication.</h2><p>{HABANOS_EVIDENCE_CAUTION}</p><p>For U.S. persons, current Treasury rules can prohibit importing Cuban-origin tobacco even when it is genuine. Confirm your own jurisdiction before buying or transporting it.</p><div className="ctaRow"><a className="button secondary" href={OFAC_CUBAN_GOODS_URL}>Open current OFAC guidance →</a><a className="button secondary" href={HABANOS_RETAIL_NETWORK_URL}>Open Habanos authorized network →</a></div></section>
    <section className="verificationSteps" aria-label="Evidence workflow"><article><strong>1</strong><span>Check jurisdiction</span><small>Legality and authenticity are separate questions.</small></article><article><strong>2</strong><span>Preserve seller and package</span><small>Save the listing, receipt, jurisdiction, full package photos, seals, and box code.</small></article><article><strong>3</strong><span>Record the lookup</span><small>Save the official result, date, evidence link, and any conflict without overstating certainty.</small></article></section>
    <section className="valueMetrics"><article><span>Lookup recorded</span><strong>{groups.recorded.length}</strong><small>User-recorded matching result</small></article><article><span>Ready for lookup</span><strong>{groups.ready.length}</strong><small>Box code and seal recorded</small></article><article><span>Evidence needed</span><strong>{groups.needed.length}</strong><small>Package details still required</small></article><article><span>Loose sticks</span><strong>{groups.loose.length}</strong><small>Original-package evidence unavailable</small></article></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Private evidence ledger</div><h2>Cuban inventory records</h2></div><a className="button secondary" href="/learn/habanos-authenticity">Use the guide →</a></div><div className="tableWrap"><table className="table verifyTable"><thead><tr><th>Cigar</th><th>Seller / jurisdiction</th><th>Box evidence</th><th>Official lookup</th><th>Status</th></tr></thead><tbody>{cubans.sort((a,b)=>cubanVerificationStatus(a).localeCompare(cubanVerificationStatus(b))).map(item=>{const status=cubanVerificationStatus(item);return <tr key={item.inventoryId}><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand} {item.line}</strong><div className="small">{item.inventoryId} · {item.vitola}</div></a></td><td>{item.acquisitionSeller||"Seller not recorded"}<div className="small">{item.purchaseJurisdiction||"Jurisdiction not recorded"}</div></td><td>{item.boxCode||"Box code not recorded"}<div className="small">{item.habanosSealPhotoLink?<a className="textLink" href={item.habanosSealPhotoLink} target="_blank" rel="noreferrer">Seal evidence ↗</a>:"Seal evidence not recorded"}</div></td><td>{item.habanosVerificationResult||"Result not recorded"}<div className="small">{item.habanosVerificationDate||"Date not recorded"}</div></td><td><span className={`verifyState verify-${status.toLowerCase().replaceAll(" ","-")}`}>{visibleStatus(status)}{status === "Verified" ? " ✓" : ""}</span></td></tr>})}</tbody></table></div></section>
  </main>;
}
