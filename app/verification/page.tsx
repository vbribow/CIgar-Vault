import { cubanVerificationStatus, isCubanInventory } from "@/lib/cuban-verification";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

const HABANOS_CHECKER = "https://www.habanos.com/en/authenticity-check/?lang=en";

export default async function VerificationPage() {
  const cubans = (await loadInventory()).filter(isCubanInventory);
  const groups = {
    verified: cubans.filter((item) => cubanVerificationStatus(item) === "Verified"),
    ready: cubans.filter((item) => cubanVerificationStatus(item) === "Ready to verify"),
    needed: cubans.filter((item) => ["Partial evidence", "Evidence needed"].includes(cubanVerificationStatus(item))),
    loose: cubans.filter((item) => cubanVerificationStatus(item) === "Loose sticks"),
  };

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">Cedriva</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/valuations">Valuation</a><a href="/collection-health">Collection health</a><a href="/storage">Storage</a></div></nav>
    <section className="verifyHero"><div><div className="eyebrow">Cuban verification</div><h1>Verify every boxed Cuban lot.</h1><p className="lede">Record the box code and seal photo, check the code with Habanos, then mark the lot verified in Cedriva.</p><div className="verifyActions"><a className="button" href={HABANOS_CHECKER}>Open official Habanos checker →</a><a className="button secondary" href="/inventory">Update inventory</a></div></div><div className="verifyScore"><strong>{groups.verified.length}</strong><span>verified Cuban lots</span><small>{groups.ready.length} ready for the official check</small></div></section>
    <section className="verificationSteps" aria-label="Verification steps"><article><strong>1</strong><span>Add box code</span><small>Enter the factory and date code from the box.</small></article><article><strong>2</strong><span>Add seal photo</span><small>Attach a clear image link showing the Habanos seal.</small></article><article><strong>3</strong><span>Confirm verification</span><small>Check the code on Habanos.com, then select “Verified on Habanos.com” while editing the lot.</small></article></section>
    <section className="valueMetrics"><article><span>Verified</span><strong>{groups.verified.length}</strong><small>Confirmed by the user on Habanos.com</small></article><article><span>Ready to verify</span><strong>{groups.ready.length}</strong><small>Box code and seal recorded</small></article><article><span>Evidence needed</span><strong>{groups.needed.length}</strong><small>Box details still required</small></article><article><span>Loose sticks</span><strong>{groups.loose.length}</strong><small>No original box claimed</small></article></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Verification ledger</div><h2>Cuban inventory evidence</h2></div><a className="button secondary" href={HABANOS_CHECKER}>Habanos checker →</a></div><div className="tableWrap"><table className="table verifyTable"><thead><tr><th>Cigar</th><th>Packaging</th><th>Box code</th><th>Habanos seal</th><th>Status</th></tr></thead><tbody>{cubans.sort((a,b)=>cubanVerificationStatus(a).localeCompare(cubanVerificationStatus(b))).map(item=>{const status=cubanVerificationStatus(item);return <tr key={item.inventoryId}><td><a href={`/inventory/${item.inventoryId}`}><strong>{item.brand} {item.line}</strong><div className="small">{item.inventoryId} · {item.vitola}</div></a></td><td>{item.packaging||"Not specified"}</td><td>{item.boxCode||"—"}</td><td>{item.habanosSealPhotoLink?<a className="textLink" href={item.habanosSealPhotoLink} target="_blank" rel="noreferrer">View seal ↗</a>:"—"}</td><td><span className={`verifyState verify-${status.toLowerCase().replaceAll(" ","-")}`}>{status}{status === "Verified" ? " ✓" : ""}</span></td></tr>})}</tbody></table></div></section>
  </main>;
}
