import type { CigarReferencePhoto as ReferencePhoto } from "@/lib/cigar-reference-photo";
import type { InventoryItem } from "@/lib/types";

export function CigarReferencePhoto({ item, photo, catalogReady }: { item: InventoryItem; photo?: ReferencePhoto; catalogReady: boolean }) {
  return <section className="section card" aria-label="Exact cigar reference photo">
    <div className="sectionHead"><div><div className="eyebrow">Exact cigar reference</div><h2>{photo ? `${item.brand} ${item.line}` : catalogReady ? "Reference photo not yet documented" : "Reference photo temporarily unavailable"}</h2><p className="small">Catalog photography is shown separately from your private ownership and provenance photos.</p></div></div>
    {photo ? <div className="photoGallery"><a href={photo.imageUrl} target="_blank" rel="noreferrer"><div><img src={photo.imageUrl} alt={`${item.brand} ${item.line} ${item.vitola} reference cigar`} /></div><strong>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</strong><small>Reference photo · open original ↗</small></a></div> : <div className="emptyState"><strong>{catalogReady ? "No attributable exact-match image is approved yet." : "The catalog could not be verified right now."}</strong><p>{catalogReady ? "Hojavía will not substitute another line, vitola, or release. Your own photos can still be added below." : "Your record and private photos remain intact; try again after the catalog reconnects."}</p></div>}
    {photo && <p className="small">Image source: <a className="textLink" href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.sourceName} ↗</a> · Catalog reference only—not proof of ownership, condition, authenticity, or provenance.</p>}
  </section>;
}
