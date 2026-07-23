"use client";

import { useMemo, useState } from "react";
import { canonicalBrand, cigarBrands } from "@/lib/brand-directory";
import type { CatalogCigar, InventoryItem } from "@/lib/types";
import { VitolaField } from "@/components/vitola-field";

export function CatalogFields({ item, catalog }: { item: InventoryItem; catalog: CatalogCigar[] }) {
  const [brand, setBrand] = useState(canonicalBrand(item.brand));
  const [line, setLine] = useState(item.line);
  const [vitola, setVitola] = useState(item.vitola);
  const brands = useMemo(() => [...new Set([...cigarBrands.map((entry) => entry.name), ...catalog.map((entry) => canonicalBrand(entry.brand))])].sort(), [catalog]);
  const brandCatalog = useMemo(() => catalog.filter((entry) => canonicalBrand(entry.brand).toLocaleLowerCase() === canonicalBrand(brand).toLocaleLowerCase()), [brand, catalog]);
  const lines = useMemo(() => [...new Set(brandCatalog.map((entry) => entry.line).filter(Boolean))].sort(), [brandCatalog]);
  const vitolas = useMemo(() => [...new Set(brandCatalog.filter((entry) => !line || entry.line.toLocaleLowerCase() === line.toLocaleLowerCase()).map((entry) => entry.vitola).filter(Boolean))].sort(), [brandCatalog, line]);
  const match = brandCatalog.find((entry) => entry.line.toLocaleLowerCase() === line.toLocaleLowerCase() && entry.vitola.toLocaleLowerCase() === vitola.toLocaleLowerCase());

  return <>
    <label><span>Brand *</span><input name="brand" required list="cigar-brand-options" value={brand} onChange={(event) => { setBrand(event.target.value); setLine(""); setVitola(""); }} placeholder="Search or enter a brand" /><datalist id="cigar-brand-options">{brands.map((value) => <option key={value} value={value} />)}</datalist><small>{brands.length} canonical brands; custom entries allowed.</small></label>
    <label><span>Line / Series</span><input name="line" list="cigar-line-options" value={line} onChange={(event) => { setLine(event.target.value); setVitola(""); }} placeholder={brand ? "Choose or enter a line" : "Select a brand first"} /><datalist id="cigar-line-options">{lines.map((value) => <option key={value} value={value} />)}</datalist><small>{brand && lines.length ? `${lines.length} catalog line${lines.length === 1 ? "" : "s"}` : "Custom entries allowed."}</small></label>
    <VitolaField value={vitola} onChange={setVitola} catalogVitolas={vitolas} constrained={Boolean(brand && line)} help={match ? `Catalog match: ${match.catalogId}` : brand && line && vitolas.length ? `${vitolas.length} researched vitola${vitolas.length === 1 ? "" : "s"} available for this exact cigar.` : brand && line ? "No confirmed vitola list is available yet. Use Other / custom rather than guessing." : "Select a brand and line to see only the vitolas available for that cigar."} />
    {match && <input name="catalogId" type="hidden" value={match.catalogId} />}
  </>;
}
