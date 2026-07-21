"use client";

import { useMemo, useState } from "react";
import { canonicalBrand, cigarBrands } from "@/lib/brand-directory";
import type { CatalogCigar, InventoryItem } from "@/lib/types";

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
    <label><span>Vitola *</span><input name="vitola" required list="cigar-vitola-options" value={vitola} onChange={(event) => setVitola(event.target.value)} placeholder={line ? "Choose or enter a vitola" : "Select a line first"} /><datalist id="cigar-vitola-options">{vitolas.map((value) => <option key={value} value={value} />)}</datalist><small>{match ? `Catalog match: ${match.catalogId}` : vitolas.length ? `${vitolas.length} matching catalog option${vitolas.length === 1 ? "" : "s"}` : "Custom entries allowed."}</small></label>
    {match && <input name="catalogId" type="hidden" value={match.catalogId} />}
  </>;
}
