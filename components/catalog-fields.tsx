"use client";

import { useMemo, useState } from "react";
import { canonicalBrand, cigarBrands } from "@/lib/brand-directory";
import type { CatalogCigar, InventoryItem } from "@/lib/types";
import { VitolaField } from "@/components/vitola-field";

export function CatalogFields({ item, catalog }: { item: InventoryItem; catalog: CatalogCigar[] }) {
  const [brand, setBrand] = useState(canonicalBrand(item.brand));
  const [line, setLine] = useState(item.line);
  const [vitola, setVitola] = useState(item.vitola);
  const [researched,setResearched]=useState<Array<{value:string;sourceUrl:string}>>([]);
  const [researching,setResearching]=useState(false);
  const [researchMessage,setResearchMessage]=useState("");
  const brands = useMemo(() => [...new Set([...cigarBrands.map((entry) => entry.name), ...catalog.map((entry) => canonicalBrand(entry.brand))])].sort(), [catalog]);
  const brandCatalog = useMemo(() => catalog.filter((entry) => canonicalBrand(entry.brand).toLocaleLowerCase() === canonicalBrand(brand).toLocaleLowerCase()), [brand, catalog]);
  const lines = useMemo(() => [...new Set(brandCatalog.map((entry) => entry.line).filter(Boolean))].sort(), [brandCatalog]);
  const vitolas = useMemo(() => [...new Set([...brandCatalog.filter((entry) => !line || entry.line.toLocaleLowerCase() === line.toLocaleLowerCase()).map((entry) => entry.vitola),...researched.map(entry=>entry.value)].filter(Boolean))].sort(), [brandCatalog, line,researched]);
  const match = brandCatalog.find((entry) => entry.line.toLocaleLowerCase() === line.toLocaleLowerCase() && entry.vitola.toLocaleLowerCase() === vitola.toLocaleLowerCase());
  async function researchVitolas(){
    if(!brand.trim()||!line.trim())return;
    setResearching(true);setResearchMessage("");setResearched([]);
    try{
      const response=await fetch(`/api/vitola-research?brand=${encodeURIComponent(brand)}&line=${encodeURIComponent(line)}`,{cache:"no-store"});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Size research failed");
      setResearched(result.data.options||[]);
      setResearchMessage(result.data.options?.length?`${result.data.options.length} source-backed size${result.data.options.length===1?"":"s"} found.`:"No defensible sizes found. Use manual entry with a source.");
    }catch(error){setResearchMessage(error instanceof Error?error.message:"Size research failed")}
    finally{setResearching(false)}
  }

  return <>
    <label><span>Brand *</span><input name="brand" required list="cigar-brand-options" value={brand} onChange={(event) => { setBrand(event.target.value); setLine(""); setVitola("");setResearched([]); }} placeholder="Search or enter a brand" /><datalist id="cigar-brand-options">{brands.map((value) => <option key={value} value={value} />)}</datalist><small>{brands.length} canonical brands; custom entries allowed.</small></label>
    <label><span>Line / Series</span><input name="line" list="cigar-line-options" value={line} onChange={(event) => { setLine(event.target.value); setVitola("");setResearched([]); }} placeholder={brand ? "Choose or enter a line" : "Select a brand first"} /><datalist id="cigar-line-options">{lines.map((value) => <option key={value} value={value} />)}</datalist><small>{brand && lines.length ? `${lines.length} catalog line${lines.length === 1 ? "" : "s"}` : "Custom entries allowed."}</small></label>
    <VitolaField value={vitola} onChange={setVitola} catalogVitolas={vitolas} constrained={Boolean(brand && line)} help={match ? `Catalog match: ${match.catalogId}` : brand && line && vitolas.length ? `${vitolas.length} researched vitola${vitolas.length === 1 ? "" : "s"} available for this exact cigar.` : brand && line ? "No confirmed vitola list is available yet. Use Other / custom rather than guessing." : "Select a brand and line to see only the vitolas available for that cigar."} />
    <div className="vitolaResearchControl"><button type="button" className="button secondary" disabled={!brand.trim()||!line.trim()||researching} onClick={researchVitolas}>{researching?"Researching sizes…":"Research available sizes"}</button>{researchMessage&&<small>{researchMessage}</small>}{researched.length>0&&<small>{[...new Set(researched.map(item=>item.sourceUrl))].slice(0,3).map((url,index)=><a href={url} target="_blank" rel="noreferrer" key={url}>Source {index+1} ↗</a>)}</small>}</div>
    {match && <input name="catalogId" type="hidden" value={match.catalogId} />}
  </>;
}
