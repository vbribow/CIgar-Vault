"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { cigarBrands } from "@/lib/brand-directory";
import type { CatalogCigar, InventoryItem } from "@/lib/types";

const evidenceTypes = ["Cigar band", "Single cigar", "Sealed box", "Open box", "Box code", "Habanos seal", "Receipt / provenance"];

export function PhotoInventoryIntake({ catalog, onDraft }: { catalog: CatalogCigar[]; onDraft: (draft: InventoryItem) => void }) {
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [brand, setBrand] = useState("");
  const [line, setLine] = useState("");
  const [message, setMessage] = useState("");
  const brands = useMemo(() => [...new Set([...cigarBrands.map((item) => item.name), ...catalog.map((item) => item.brand)])].sort(), [catalog]);
  const lines = useMemo(() => [...new Set(catalog.filter((item) => !brand || item.brand.toLowerCase() === brand.toLowerCase()).map((item) => item.line))].sort(), [brand, catalog]);
  const vitolas = useMemo(() => [...new Set(catalog.filter((item) => (!brand || item.brand.toLowerCase() === brand.toLowerCase()) && (!line || item.line.toLowerCase() === line.toLowerCase())).map((item) => item.vitola))].sort(), [brand, line, catalog]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setMessage("Photo must be 12 MB or smaller."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file)); setFileName(file.name);
  }

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quantity = Number(data.get("quantity") || 0);
    const draft: InventoryItem = {
      inventoryId: `INV-PHOTO-${Date.now().toString(36).toUpperCase()}`,
      brand: String(data.get("brand") || "").trim(),
      line: String(data.get("line") || "").trim(),
      vitola: String(data.get("vitola") || "").trim(),
      vintage: String(data.get("vintage") || "").trim() || undefined,
      looseStickQty: quantity || undefined,
      smokedQty: 0,
      status: "Hold",
      priority: "Medium",
      notes: `Photo-assisted intake (${data.get("evidenceType")}): ${fileName}. Identification confidence: manual review required.`,
    };
    onDraft(draft); setMessage("Draft created below. Review every field before saving.");
    document.querySelector(".editor")?.scrollIntoView({ behavior: "smooth" });
  }

  return <section className="photoIntake card"><div><div className="eyebrow">Photo-assisted inventory</div><h2>Start with a picture.</h2><p>Take or upload a clear photo, enter what you can identify, and Cigar Vault will constrain the remaining choices from its catalog. Nothing saves until you approve the draft.</p></div><div className="photoIntakeLayout"><label className="photoDrop"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onChange={chooseFile}/>{preview?<img src={preview} alt="Inventory evidence preview"/>:<span><b>Take or choose photo</b><small>Band, cigar, box, seal, or box code</small></span>}</label><form onSubmit={createDraft}><label><span>Evidence type</span><select name="evidenceType">{evidenceTypes.map((value)=><option key={value}>{value}</option>)}</select></label><label><span>Likely brand *</span><input name="brand" value={brand} onChange={(event)=>{setBrand(event.target.value);setLine("")}} list="photo-brand-options" required placeholder="Search brand"/><datalist id="photo-brand-options">{brands.map((value)=><option key={value} value={value}/>)}</datalist></label><label><span>Likely line</span><input name="line" value={line} onChange={(event)=>setLine(event.target.value)} list="photo-line-options" placeholder="Choose or type"/><datalist id="photo-line-options">{lines.map((value)=><option key={value} value={value}/>)}</datalist></label><label><span>Likely vitola *</span><input name="vitola" list="photo-vitola-options" required placeholder="Choose or type"/><datalist id="photo-vitola-options">{vitolas.map((value)=><option key={value} value={value}/>)}</datalist></label><label><span>Release / vintage year</span><input name="vintage" inputMode="numeric" placeholder="Example: 2023"/></label><label><span>Visible quantity</span><input name="quantity" type="number" min="0" step="1" placeholder="Loose sticks"/></label><button className="button" disabled={!preview}>Create review draft</button>{message&&<output>{message}</output>}</form></div><div className="photoAiStatus"><span>Visual identification</span><strong>Foundation ready</strong><small>Catalog-assisted review works now. Automated band and packaging recognition activates when a secure vision API credential is configured.</small></div></section>;
}
