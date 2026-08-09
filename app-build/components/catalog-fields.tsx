"use client";

import { useMemo, useState } from "react";
import { canonicalBrand, cigarBrands } from "@/lib/brand-directory";
import type { CatalogCigar, InventoryItem } from "@/lib/types";
import { VitolaField } from "@/components/vitola-field";

export function CatalogFields({ item, catalog }: { item: InventoryItem; catalog: CatalogCigar[] }) {
  const [brand, setBrand] = useState(canonicalBrand(item.brand));
  const [manualBrand, setManualBrand] = useState(false);
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
      setResearchMessage(result.data.options?.length?`${result.data.options.length} documented size${result.data.options.length===1?"":"s"} found.`:"No confirmed sizes were found. Enter the exact size shown on your cigar or package.");
    }catch(error){setResearchMessage(error instanceof Error?error.message:"Size research failed")}
    finally{setResearching(false)}
  }

  return <>
    <div className="manufacturerEntryField">
      <label><span>Brand / manufacturer *</span><input name="brand" required list={manualBrand?undefined:"cigar-brand-options"} value={brand} onChange={(event) => { setBrand(event.target.value); setLine(""); setVitola("");setResearched([]); }} placeholder={manualBrand?"Enter the name exactly as shown on the cigar":"Search known brands and manufacturers"} autoComplete="organization" /><datalist id="cigar-brand-options">{brands.map((value) => <option key={value} value={value} />)}</datalist><small>{manualBrand?"This name will be preserved on your private record. Hojavía will not treat it as verified catalog information until it is researched.":`${brands.length} known names available. If yours is missing, add it manually.`}</small></label>
      <button type="button" className="textLink" aria-pressed={manualBrand} onClick={()=>{setManualBrand(current=>!current);setBrand("");setLine("");setVitola("");setResearched([])}}>{manualBrand?"Search known manufacturers":"Manufacturer not listed? Enter it manually"}</button>
    </div>
    <label><span>Line / Series</span><input name="line" list="cigar-line-options" value={line} onChange={(event) => { setLine(event.target.value); setVitola("");setResearched([]); }} placeholder={brand ? "Choose or enter a line" : "Select a brand first"} /><datalist id="cigar-line-options">{lines.map((value) => <option key={value} value={value} />)}</datalist><small>{brand && lines.length ? `${lines.length} known line${lines.length === 1 ? "" : "s"}` : "Enter the line name exactly as shown."}</small></label>
    <VitolaField value={vitola} onChange={setVitola} catalogVitolas={vitolas} constrained={Boolean(brand && line)} help={match ? "Matched to the Hojavía cigar reference." : brand && line && vitolas.length ? `${vitolas.length} documented size${vitolas.length === 1 ? "" : "s"} available for this cigar.` : brand && line ? "No confirmed size list is available yet. Choose Other / custom and enter the exact size shown." : "Select a brand and line to see known sizes for that cigar."} />
    <div className="vitolaResearchControl"><button type="button" className="button secondary" disabled={!brand.trim()||!line.trim()||researching} onClick={researchVitolas}>{researching?"Researching sizes…":"Research available sizes"}</button>{researchMessage&&<small>{researchMessage}</small>}{researched.length>0&&<small>{[...new Set(researched.map(item=>item.sourceUrl))].slice(0,3).map((url,index)=><a href={url} target="_blank" rel="noreferrer" key={url}>Source {index+1} ↗</a>)}</small>}</div>
    <input name="catalogId" type="hidden" value={match?.catalogId || ""} />
  </>;
}
