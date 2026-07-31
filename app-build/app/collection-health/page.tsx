import { loadInventory as loadAllInventory } from "@/lib/inventory";
import { loadCollections } from "@/lib/data";
import { hasDocumentedCurrentQuantity, inventoryCompleteness } from "@/lib/inventory-model";
import { auditCollectionMembership } from "@/lib/collection-membership-audit";
import { brand } from "@/lib/brand";
import { cigarInventoryRecords } from "@/lib/collection-presentation";
import { auditCollectionTemplateLibrary, collectionTemplates } from "@/lib/collection-templates";
import "./health.css";

export const dynamic = "force-dynamic";

async function loadInventory() {
  const [items, collections] = await Promise.all([loadAllInventory(), loadCollections()]);
  return cigarInventoryRecords(items, collections);
}

export default async function CollectionHealth() {
  const [itemsResult, collectionsResult] = await Promise.allSettled([loadInventory(), loadCollections()]);

  if (itemsResult.status !== "fulfilled" || collectionsResult.status !== "fulfilled") {
    return <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">{brand.name}</a>
        <div className="navLinks"><a href="/inventory">Inventory</a><a href="/collections">Collections</a></div>
      </nav>
      <section className="card healthUnavailable">
        <div className="eyebrow">Audit protected</div>
        <h1>Inventory audit is temporarily paused.</h1>
        <p>The platform could not safely load both inventory and collection records. No lot has been classified as incomplete, mismatched, or missing. Refresh after the account service recovers.</p>
      </section>
    </main>;
  }

  const items = itemsResult.value;
  const collections = collectionsResult.value;
  const activeItems = items.filter((item) => (item.currentQty ?? 0) > 0);
  const membership = auditCollectionMembership(activeItems, collections);
  const library = auditCollectionTemplateLibrary(collectionTemplates);
  const reviews = membership.rows.filter((row) => row.classification === "Review");
  const checks = [
    {
      key: "quantity",
      label: "Physical quantity",
      detail: "Saved total; box and loose-stick detail is optional",
      missing: activeItems.filter((item) => !hasDocumentedCurrentQuantity(item)),
    },
    {
      key: "value",
      label: "Replacement value",
      detail: "Retail price per cigar",
      missing: activeItems.filter((item) => item.retailValue === undefined),
    },
    {
      key: "vintage",
      label: "Production year",
      detail: "Exact cigar year—not collection year",
      missing: activeItems.filter((item) => item.vintage === undefined),
    },
    {
      key: "storage",
      label: "Storage location",
      detail: "Current humidor or location",
      missing: activeItems.filter((item) => !item.storageLocationId),
    },
    {
      key: "provenance",
      label: "Provenance",
      detail: "Purchase or ownership evidence",
      missing: activeItems.filter((item) => !item.provenanceNotes),
    },
  ];
  const average = Math.round(activeItems.reduce((sum, item) => sum + inventoryCompleteness(item), 0) / Math.max(activeItems.length, 1));
  const ready = activeItems.filter((item) => inventoryCompleteness(item) === 100).length;

  return <main className="shell">
    <nav className="nav">
      <a className="brand" href="/">{brand.name}</a>
      <div className="navLinks">
        <a href="/inventory#inventory-records">Browse Vault</a>
        <a href="/inventory-count">Physical count</a>
        <a href="/collections">Collections</a>
        <a href="/storage">Storage</a>
      </div>
    </nav>

    <section className="healthHero">
      <div>
        <div className="eyebrow">Inventory integrity · Guided review</div>
        <h1>Audit my inventory.</h1>
        <p className="lede">Work through physical quantities, production years, replacement values, storage, provenance, and exact collection relationships. Every result opens the records that need that specific correction.</p>
        <div className="heroActions">
          <a className="button secondary" href="/inventory#inventory-records">Browse all records</a>
          <a className="button secondary" href="/inventory-count">Reconcile physical count</a>
        </div>
      </div>
      <div className="healthScore">
        <strong>{average}%</strong>
        <span>active inventory completeness</span>
        <small>{ready} of {activeItems.length} active lots fully documented</small>
      </div>
    </section>

    <section className="healthGrid" aria-label="Inventory audit categories">
      {checks.map((check) => <a className="healthCard" href={`/inventory?missing=${check.key}&active=1#inventory-records`} key={check.key}>
        <div><span>{check.label}</span><strong>{check.missing.length}</strong></div>
        <p>{check.missing.length ? `${check.missing.length} active lots need attention` : "Complete across active inventory"}</p>
        <small>{check.detail}</small>
        <b>{check.missing.length ? "Review these records →" : "Complete ✓"}</b>
      </a>)}
    </section>

    <section className="section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Collection catalog truth</div>
          <h2>One evidence protocol governs every collection.</h2>
          <p>Automatic population is allowed only when every physical lot has attributable exact-vitola evidence and documented quantities reconcile to the collection total.</p>
        </div>
        <span className={`statusBadge ${library.automationReady ? "statusOwned" : "statusMissing"}`}>
          {library.automationReady ? `${library.ready}/${library.total} verified` : `${library.blocked.length} blocked`}
        </span>
      </div>
      <div className="healthGrid">
        <div className="healthCard"><div><span>Researched templates</span><strong>{library.total}</strong></div><p>Current and future collections use the same admission rules.</p></div>
        <div className="healthCard"><div><span>Automation-ready</span><strong>{library.ready}</strong></div><p>Exact lots, sources, and quantities reconcile.</p></div>
        <div className="healthCard"><div><span>Blocked from population</span><strong>{library.blocked.length}</strong></div><p>{library.blocked.length?"Evidence gaps remain visible and cannot create inventory.":"No incomplete template can silently create inventory."}</p></div>
      </div>
      {library.blocked.length>0&&<div className="cleanupList">{library.blocked.map(({template,audit})=><a href={template.sourceUrl} target="_blank" rel="noreferrer" key={template.templateId}><span><strong>{template.name}</strong><small>{audit.issues.join(" · ")}</small></span><b>Research source ↗</b></a>)}</div>}
    </section>

    <section className="section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Membership truth</div>
          <h2>Every active lot has a documented context</h2>
          <p>Collection links require evidence. The same cigar may remain available as both a standalone lot and a collection component without combining quantities or provenance.</p>
        </div>
        <span className={`statusBadge ${membership.ready ? "statusOwned" : "statusMissing"}`}>
          {membership.ready ? "Audit clear" : `${reviews.length + membership.collectionIssues.length} need review`}
        </span>
      </div>
      <div className="healthGrid">
        {(["Standalone", "Collection component", "Both", "Review"] as const).map((label) => <div className="healthCard" key={label}>
          <div><span>{label}</span><strong>{membership.counts[label]}</strong></div>
          <p>{label === "Both" ? "Same cigar identity exists in standalone and verified collection contexts." : label === "Review" ? "Membership or edition evidence requires attention." : "Documented inventory classification."}</p>
        </div>)}
      </div>
      {(reviews.length > 0 || membership.collectionIssues.length > 0) && <div className="cleanupList">
        {reviews.slice(0, 12).map((row) => <a href={`/inventory/${encodeURIComponent(row.inventoryId)}`} key={row.inventoryId}>
          <span><strong>{row.inventoryId}</strong><small>{row.collectionName || row.collectionId || "Collection relationship"} · {row.issues.join(" · ")}</small></span>
          <b>Review →</b>
        </a>)}
        {membership.collectionIssues.slice(0, 8).map((issue) => <a href={`/collections/${encodeURIComponent(issue.collectionId)}`} key={`${issue.collectionId}-${issue.issue}`}>
          <span><strong>{issue.collectionName}</strong><small>{issue.detail}</small></span>
          <b>Review collection →</b>
        </a>)}
      </div>}
    </section>

    <section className="section">
      <div className="sectionHead">
        <div><div className="eyebrow">Highest impact</div><h2>Complete these next</h2></div>
        <a className="button secondary" href="/inventory?missing=quantity&active=1#inventory-records">Start with quantities</a>
      </div>
      <div className="cleanupList">
        {[...activeItems].sort((a, b) => inventoryCompleteness(a) - inventoryCompleteness(b)).slice(0, 8).map((item) => <a href={`/inventory/${item.inventoryId}`} key={item.inventoryId}>
          <span><strong>{item.brand} {item.line}</strong><small>{item.inventoryId} · {item.vitola}</small></span>
          <span className="completionMeter"><i style={{ width: `${inventoryCompleteness(item)}%` }} /><b>{inventoryCompleteness(item)}%</b></span>
        </a>)}
      </div>
    </section>
  </main>;
}
