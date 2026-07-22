"use client";

import { FormEvent, useState } from "react";
import type { InventoryItem } from "@/lib/types";

const kinds = [
  ["cigar", "Cigar"], ["box", "Box"], ["habanos-seal", "Habanos seal"], ["box-code", "Box code"], ["provenance", "Receipt / provenance"],
] as const;

export function PhotoManager({ item }: { item: InventoryItem }) {
  const [photos, setPhotos] = useState({ cigar: item.photoLink, box: item.boxPhotoLink, seal: item.habanosSealPhotoLink, code: item.boxCodePhotoLink, provenance: item.provenanceDocumentLink });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setUploading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}/photos`, { method: "POST", body: form });
    const result = await response.json().catch(()=>({error:`Upload service returned ${response.status}`}));
    if (response.ok) {
      const map: Record<string, keyof typeof photos> = { cigar: "cigar", box: "box", "habanos-seal": "seal", "box-code": "code", provenance: "provenance" };
      setPhotos((current) => ({ ...current, [map[result.kind]]: result.url }));
      setMessage("Photo attached ✓"); event.currentTarget.reset();
    } else setMessage(result.error || "Upload failed");
    setUploading(false);
  }

  const gallery = [["Cigar", photos.cigar], ["Box", photos.box], ["Habanos seal", photos.seal], ["Box code", photos.code], ["Provenance", photos.provenance]].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return <section className="section photoSection"><div className="sectionHead"><div><div className="eyebrow">Visual provenance</div><h2>Photos & documents</h2></div></div>
    {gallery.length ? <div className="photoGallery">{gallery.map(([label,url])=><a href={url} target="_blank" rel="noreferrer" key={label}><div>{url.toLowerCase().includes(".pdf") ? <span className="documentThumb">PDF</span> : <img src={url} alt={`${item.brand} ${label}`} />}</div><strong>{label}</strong><small>Open original ↗</small></a>)}</div> : <div className="emptyState">No photos attached yet.</div>}
    <form className="photoUpload" onSubmit={upload}><label><span>Photo type</span><select name="kind">{kinds.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label><span>Choose or take photo</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" required /></label><button className="button" disabled={uploading}>{uploading ? "Uploading…" : "Attach file"}</button>{message && <output>{message}</output>}</form>
    <p className="small">JPG, PNG, WebP, HEIC, or PDF · Maximum 12 MB. A new upload replaces the displayed file for that photo type.</p>
  </section>;
}
