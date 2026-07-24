import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildCanonicalCigarRecord } from "@/lib/canonical-cigar-record";
import { loadCatalog } from "@/lib/catalog";
import { canonicalCigarIdentity } from "@/lib/cigar-identity";
import { loadInventory } from "@/lib/inventory";
import type { CanonicalRecordField } from "@/lib/canonical-cigar-record";
import "./record.css";

export const dynamic = "force-dynamic";

function FieldGrid({ fields }: { fields: CanonicalRecordField[] }) {
  return <dl className="canonicalFieldGrid">{fields.map((field) => <div key={field.key} data-status={field.status}>
    <dt>{field.label}</dt>
    <dd>{field.value || "Not yet documented"}</dd>
    <small>{field.status === "Documented" ? "Documented" : field.guidance}</small>
  </div>)}</dl>;
}

async function recordFor(catalogId: string) {
  const inventory = await loadInventory();
  const catalog = await loadCatalog(inventory);
  const decoded = decodeURIComponent(catalogId);
  const item = catalog.find((candidate) => candidate.catalogId === decoded || canonicalCigarIdentity(candidate).identityId === decoded);
  return item ? buildCanonicalCigarRecord(item, inventory) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ catalogId: string }> }): Promise<Metadata> {
  const { catalogId } = await params;
  const record = await recordFor(catalogId);
  return record
    ? { title: `${record.brand} ${record.line} ${record.vitola}`, description: `Cedriva’s canonical, evidence-aware record for the ${record.brand} ${record.line} ${record.vitola}.` }
    : { title: "Cigar Record" };
}

export default async function CanonicalCigarRecordPage({ params }: { params: Promise<{ catalogId: string }> }) {
  const { catalogId } = await params;
  const record = await recordFor(catalogId);
  if (!record) notFound();
  const ownedQuantity = record.ownedLots.reduce((sum, lot) => sum + (lot.currentQty ?? 0), 0);

  return <main className="shell canonicalRecordPage">
    <nav className="canonicalBreadcrumb"><Link href="/catalog">Cigar Reference</Link><span>→</span><span>{record.catalogId}</span></nav>

    <section className="canonicalHero">
      <div>
        <div className="eyebrow">Cedriva Canonical Cigar Record · v{record.recordVersion}</div>
        <h1>{record.brand}</h1>
        <p>{record.line}</p>
        <span>{record.vitola}</span>
        <div className="canonicalIdentifiers"><span>Catalog {record.catalogId}</span><span>Identity {record.identityId}</span></div>
      </div>
      <aside>
        <span>Record completeness</span>
        <strong>{record.completion}%</strong>
        <div aria-label={`${record.completion} percent complete`}><i style={{ width: `${record.completion}%` }} /></div>
        <p>{record.status}</p>
        <small>Unknown fields remain visible until attributable evidence supports them.</small>
      </aside>
    </section>

    <section className="canonicalPrinciple">
      <strong>One cigar. Every connected truth.</strong>
      <p>This is the shared product record used by Discover, Vault, Learn, Verify, Market, Reviews, and Cedriva AI. Collector ownership remains private and separate.</p>
    </section>

    <section className="canonicalSection" id="identity">
      <div className="canonicalSectionHead"><div><div className="eyebrow">01 · Identity</div><h2>What is this cigar?</h2></div><p>Brand, line, vitola, dimensions, and stated origin establish the reusable product identity.</p></div>
      <FieldGrid fields={record.identity} />
    </section>

    <section className="canonicalSection" id="manufacturing">
      <div className="canonicalSectionHead"><div><div className="eyebrow">02 · Manufacturing truth</div><h2>Who actually made it?</h2></div><p>Product-level proof is kept separate from broader brand and factory history.</p></div>
      <div className="canonicalManufacturing">
        <article data-verified={Boolean(record.manufacturing.productFactory)}>
          <span>Exact product factory</span>
          <h3>{record.manufacturing.productFactory || "Not yet verified"}</h3>
          <p>{record.manufacturing.caution}</p>
        </article>
        <article>
          <span>Brand manufacturing context</span>
          <h3>{record.manufacturing.status}</h3>
          <p>{record.manufacturing.brandContext}</p>
          <a href={record.manufacturing.href}>Open manufacturing evidence →</a>
        </article>
      </div>
    </section>

    <section className="canonicalSection" id="blend">
      <div className="canonicalSectionHead"><div><div className="eyebrow">03 · Blend architecture</div><h2>What tobacco shapes the experience?</h2></div><p>Wrapper, binder, filler, origin, and stated strength are documented without turning geography into a flavor promise.</p></div>
      <FieldGrid fields={record.blend} />
      <Link className="canonicalTextLink" href="/learn/blending">Understand how each leaf contributes →</Link>
    </section>

    <section className="canonicalSection" id="release">
      <div className="canonicalSectionHead"><div><div className="eyebrow">04 · Release and artifact</div><h2>Where does it belong in history?</h2></div><p>Release period, edition, MSRP, packaging, bands, and production state preserve changes instead of overwriting them.</p></div>
      <FieldGrid fields={record.release} />
    </section>

    <section className="canonicalSection canonicalEvidenceSection" id="evidence">
      <div className="canonicalSectionHead"><div><div className="eyebrow">05 · Evidence ledger</div><h2>Why should this record be trusted?</h2></div><p>Each source states what it supports. Brand-level evidence never silently becomes product-level proof.</p></div>
      <div className="canonicalEvidenceList">
        {record.evidence.map((source, index) => <article key={`${source.sourceName}-${index}`}>
          <div><span>{source.sourceType}</span><span>{source.confidence} confidence</span>{source.checkedAt && <span>Checked {source.checkedAt}</span>}</div>
          <h3>{source.sourceName}</h3>
          <p>{source.supports}</p>
          {source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">Inspect source ↗</a>}
        </article>)}
        {!record.evidence.length && <article className="canonicalEmptyEvidence"><h3>No attributable source is attached yet.</h3><p>The identity remains searchable, but all substantive claims stay in research status.</p></article>}
      </div>
      {record.correctionNotes && <div className="canonicalCorrection"><strong>Correction history</strong><p>{record.correctionNotes}</p></div>}
    </section>

    <section className="canonicalResearch" id="research">
      <div>
        <div className="eyebrow">Research brief</div>
        <h2>{record.researchGaps.length} field{record.researchGaps.length === 1 ? "" : "s"} still need evidence.</h2>
        <p>Research begins with official product pages, press releases, packaging, and direct manufacturer information. Independent historical sources can corroborate or preserve earlier states.</p>
        <div className="ctaRow"><Link className="button" href={`/catalog-discovery?catalogId=${encodeURIComponent(record.catalogId)}#research-backlog`}>Open research workflow</Link><Link className="button secondary" href="/learn/manufacturing-truth#research-standard">Review evidence standard</Link></div>
      </div>
      <ol>{record.researchGaps.map((gap, index) => <li key={gap}><span>{String(index + 1).padStart(2, "0")}</span><strong>{gap}</strong></li>)}</ol>
    </section>

    <section className="canonicalCollector">
      <div><div className="eyebrow">Private collector connection</div><h2>{record.ownedLots.length ? `${ownedQuantity} owned cigar${ownedQuantity === 1 ? "" : "s"}` : "Not currently in your vault"}</h2><p>The canonical product is shared knowledge. Acquisition, quantity, storage, journal, provenance, valuation, and legacy remain private collector records.</p></div>
      <div className="ctaRow">{record.ownedLots[0] && <Link className="button" href={`/cigars/${record.identityId}`}>Open my cigar story</Link>}<Link className="button secondary" href="/inventory">Document in my vault</Link></div>
    </section>
  </main>;
}
