import { canonicalBrand } from "./brand-directory";
import type { CatalogCigar } from "./types";

function lineKey(value:string){
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/\bopus\s+x\b/g,"opusx").replace(/[^a-z0-9]+/g," ").trim()
    .replace(/^fuente fuente\s+/,"");
}

export function catalogLinesForBrand(catalog:CatalogCigar[],brand:string){
  const canonical=canonicalBrand(brand);
  return [...new Set(catalog.filter(item=>canonicalBrand(item.brand)===canonical).map(item=>item.line).filter(Boolean))].sort();
}

export function catalogVitolasForCigar(catalog:CatalogCigar[],brand:string,line:string){
  const canonical=canonicalBrand(brand),selected=lineKey(line);
  const branded=catalog.filter(item=>canonicalBrand(item.brand)===canonical);
  const exact=branded.filter(item=>lineKey(item.line)===selected);
  const matches=exact.length?exact:branded.filter(item=>{
    const candidate=lineKey(item.line);
    return Boolean(candidate)&&selected.startsWith(`${candidate} `);
  });
  return [...new Set(matches.map(item=>item.vitola).filter(Boolean))].sort();
}
