"use client";

import { FormEvent, useRef, useState } from "react";
import type { InventoryItem } from "@/lib/types";

const kinds = [
  ["cigar", "Cigar"], ["box", "Box"], ["habanos-seal", "Habanos seal"], ["box-code", "Box code"], ["provenance", "Receipt / provenance"],
] as const;
const fields = {
  cigar: "photoLink",
  box: "boxPhotoLink",
  "habanos-seal": "habanosSealPhotoLink",
  "box-code": "boxCodePhotoLink",
  provenance: "provenanceDocumentLink",
} as const;
type PhotoKind = keyof typeof fields;

export function PhotoManager({ item, onAttached }: { item: InventoryItem; onAttached?: (item: InventoryItem) => void }) {
  const [photos, setPhotos] = useState({ cigar: item.photoLink, box: item.boxPhotoLink, seal: item.habanosSealPhotoLink, code: item.boxCodePhotoLink, provenance: item.provenanceDocumentLink });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState("");
  const activeUpload = useRef<AbortController | null>(null);

  function attach(updated: InventoryItem, kind: PhotoKind, url: string) {
    const displayField = { cigar: "cigar", box: "box", "habanos-seal": "seal", "box-code": "code", provenance: "provenance" } as const;
    setPhotos((current) => ({ ...current, [displayField[kind]]: url }));
    onAttached?.(updated);
  }

  async function reconcile(kind: PhotoKind, previousUrl?: string) {
    setPhase("Confirming saved photo…");
    try {
      const response = await fetch("/api/inventory", { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const result = await response.json();
      const updated = Array.isArray(result.data) ? result.data.find((candidate: InventoryItem) => candidate.inventoryId === item.inventoryId) as InventoryItem | undefined : undefined;
      const url = updated?.[fields[kind]];
      if (response.ok && updated && typeof url === "string" && url && url !== previousUrl) {
        attach(updated, kind, url);
        setMessage("Photo attached and inventory synced ✓");
        return true;
      }
    } catch {/* the original upload error remains the useful message */}
    return false;
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const kind = String(form.get("kind") || "") as PhotoKind;
    const previousUrl = item[fields[kind]];
    const controller = new AbortController();
    activeUpload.current?.abort();
    activeUpload.current = controller;
    let timeout = 0;
    setUploading(true);
    setPhase("Uploading securely…");
    setMessage("");

    try {
      const request = fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}/photos`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const response = await Promise.race([
        request,
        new Promise<never>((_, reject) => {
          timeout = window.setTimeout(() => {
            controller.abort();
            reject(new DOMException("Upload timed out", "TimeoutError"));
          }, 60_000);
        }),
      ]);
      setPhase("Confirming inventory sync…");
      const result = await response.json().catch(() => ({ error: `Upload service returned ${response.status}` }));
      if (!response.ok) throw new Error(result.error || "Upload failed");

      attach(result.data, result.kind, result.url);
      setMessage("Photo attached and inventory synced ✓");
      formElement.reset();
    } catch (error) {
      const timedOut = error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name);
      if (timedOut && await reconcile(kind, previousUrl)) {
        formElement.reset();
      } else if (timedOut) {
        setMessage("The upload did not finish within one minute. Nothing new is attached; you can safely try again.");
      } else {
        setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (activeUpload.current === controller) activeUpload.current = null;
      setPhase("");
      setUploading(false);
    }
  }

  const gallery = [["Cigar", photos.cigar], ["Box", photos.box], ["Habanos seal", photos.seal], ["Box code", photos.code], ["Provenance", photos.provenance]].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return <section className="section photoSection"><div className="sectionHead"><div><div className="eyebrow">Visual provenance</div><h2>Photos & documents</h2></div></div>
    {gallery.length ? <div className="photoGallery">{gallery.map(([label,url])=><a href={url} target="_blank" rel="noreferrer" key={label}><div>{url.toLowerCase().includes(".pdf") ? <span className="documentThumb">PDF</span> : <img src={url} alt={`${item.brand} ${label}`} />}</div><strong>{label}</strong><small>Open original ↗</small></a>)}</div> : <div className="emptyState">No photos attached yet.</div>}
    <form className="photoUpload" onSubmit={upload} aria-busy={uploading}><label><span>Photo type</span><select name="kind" disabled={uploading}>{kinds.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label><span>Choose or take photo</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required disabled={uploading} /></label><button type="submit" className="button" disabled={uploading}>{uploading ? phase || "Uploading & syncing…" : "Attach file"}</button>{message && <output aria-live="polite">{message}</output>}</form>
    <p className="small">JPG, PNG, WebP, or PDF · Maximum 12 MB. Export iPhone HEIC photos as JPG first. A successful replacement removes the prior private file.</p>
  </section>;
}
