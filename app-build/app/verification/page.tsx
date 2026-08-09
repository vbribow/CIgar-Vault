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
  const inventoryResult = await Promise.allSettled([loadInventory()]);
  if (inventoryResult[0].status !== "fulfilled") {
    return <VerificationDataUnavailable />;
  }
  const cubans = inventoryResult[0].value.filter(isCubanInventory);
  const groups = {
    recorded: cubans.filter((item) => cubanVerificationStatus(item) === "Verified"),
    ready: cubans.filter((item) => cubanVerificationStatus(item) === "Ready to verify"),
    needed: cubans.filter((item) => ["Partial evidence", "Evidence needed"].includes(cubanVerificationStatus(item))),
    loose: cubans.filter((item) => cubanVerificationStatus(item) === "Loose sticks"),
  };

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/learn/habanos-authenticity">Authenticity guide</a><a href="/storage">Storage</a></div></nav>
    <section className="verifyHero"><div><div className="eyebrow">Habanos authenticity records</div><h1>Keep every useful check in one place.</h1><p className="lede">Record the seller, purchase location, packaging photos, official lookup, and ownership history separately. One positive sign does not prove everything.</p><div className="verifyActions"><a className="button" href="/collector-walkthrough">Practice with a safe example</a><a className="button secondary" href={HABANOS_AUTHENTICITY_URL} target="_blank" rel="noreferrer">Open Habanos official lookup ↗</a><a className="button secondary" href="/inventory">Update inventory</a></div><p className="sourceReturnNote">Official tools open in a new tab, so {brand.name} stays available when you return.</p></div><div className="verifyScore"><strong>{groups.recorded.length}</strong><span>official lookup results recorded</span><small>{groups.ready.length} boxes ready for the official lookup</small></div></section>
    <section className="section card"><div className="eyebrow">Evidence boundary</div><h2>A matching result is not a complete authentication.</h2><p>{HABANOS_EVIDENCE_CAUTION}</p><p>For U.S. persons, current Treasury rules can prohibit importing Cuban-origin tobacco even when it is genuine. Confirm your own jurisdiction before buying or transporting it.</p><div className="ctaRow"><a className="button secondary" href={OFAC_CUBAN_GOODS_URL} target="_blank" rel="noreferrer">Open current OFAC guidance ↗</a><a className="button secondary" href={HABANOS_RETAIL_NETWORK_URL} target="_blank" rel="noreferrer">Open Habanos authorized network ↗</a></div></section>
    <section className="verificationSteps" aria-label="Evidence workflow"><article><strong>1</strong><span>Check jurisdiction</span><small>Legality and authenticity are separate questions.</small></article><article><strong>2</strong><span>Preserve seller and package</span><small>Save the listing, receipt, jurisdiction, full package photos, seals, and box code.</small></article><article><strong>3</strong><span>Record the lookup</span><small>Save the official result, date, evidence link, and any conflict without overstating certainty.</small></article></section>
    <section className="valueMetrics"><article><span>Lookup recorded</span><strong>{groups.recorded.length}</strong><small>User-recorded matching result</small></article><article><span>Ready for lookup</span><strong>{groups.ready.length}</strong><small>Box code and seal recorded</small></article><article><span>Evidence needed</span><strong>{groups.needed.length}</strong><small>Package details still required</small></article><article><span>Loose sticks</span><strong>{groups.loose.length}</strong><small>Original-package evidence unavailable</small></article></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">My private authenticity records</div><h2>Cuban cigars in my Vault</h2></div><a className="button secondary" href="/learn/habanos-authenticity">Use the guide →</a></div><div className="tableWrap"><table className="table verifyTable"><thead><tr><th>Cigar</th><th>Seller / purchase location</th><th>Box details</th><th>Official lookup</th><th>Status</th></tr></thead><tbody>{cubans.sort((a,b)=>cubanVerificationStatus(a).localeCompare(cubanVerificationStatus(b))).map(item=>{const status=cubanVerificationStatus(item);return <tr key={item.inventoryId}><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand} {item.line}</strong><div className="small">{item.inventoryId} · {item.vitola}</div></a></td><td>{item.acquisitionSeller||"Seller not recorded"}<div className="small">{item.purchaseJurisdiction||"Purchase location not recorded"}</div></td><td>{item.boxCode||"Box code not recorded"}<div className="small">{item.habanosSealPhotoLink?<a className="textLink" href={item.habanosSealPhotoLink} target="_blank" rel="noreferrer">View seal photo ↗</a>:"Seal photo not recorded"}</div></td><td>{item.habanosVerificationResult||"Result not recorded"}<div className="small">{item.habanosVerificationDate||"Date not recorded"}</div></td><td><span className={`verifyState verify-${status.toLowerCase().replaceAll(" ","-")}`}>{visibleStatus(status)}{status === "Verified" ? " ✓" : ""}</span></td></tr>})}</tbody></table></div></section>
  </main>;
}

function VerificationDataUnavailable() {
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/learn/habanos-authenticity">Authenticity guide</a></div></nav>
    <section className="section card" role="alert" aria-labelledby="verification-unavailable-title">
      <div className="eyebrow">Evidence records protected</div>
      <h1 id="verification-unavailable-title">Verification is temporarily paused.</h1>
      <p className="lede">{brand.name} could not safely load the inventory record needed for this evidence ledger. No lot has been classified as verified, incomplete, or missing.</p>
      <div className="ctaRow"><a className="button" href="/verification">Try again</a><a className="button secondary" href="/learn/habanos-authenticity">Use the authenticity guide</a></div>
    </section>
  </main>;
}
