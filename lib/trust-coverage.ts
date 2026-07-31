import { buildCanonicalCigarRecord } from "./canonical-cigar-record";
import type { PublicIndustryProfile, PublicIndustryRegistryRecord } from "./industry-public";
import type { CatalogCigar, InventoryItem } from "./types";

export type CoverageMetric={key:string;label:string;score:number;numerator:number;denominator:number;detail:string;href:string};
const pct=(a:number,b:number)=>b?Math.round(a/b*100):0;

export function buildTrustCoverage(input:{catalog:CatalogCigar[];inventory:InventoryItem[];profiles?:PublicIndustryProfile[];registry?:PublicIndustryRegistryRecord[]}){
  const{catalog,inventory}=input,records=catalog.map(item=>buildCanonicalCigarRecord(item,inventory)),total=Math.max(catalog.length,1);
  const sourced=catalog.filter(item=>Boolean(item.sourceUrl)).length,factories=catalog.filter(item=>Boolean(item.factory)).length,blends=catalog.filter(item=>Boolean(item.wrapper&&item.binder&&item.filler)).length,releases=catalog.filter(item=>Boolean(item.releaseYear)).length,packaging=catalog.filter(item=>Boolean(item.packaging||item.bandHistory)).length;
  const owned=Math.max(inventory.length,1),provenance=inventory.filter(item=>Boolean(item.provenanceNotes||item.provenanceDocumentLink)).length,images=inventory.filter(item=>Boolean(item.photoLink||item.boxPhotoLink)).length,identity=inventory.filter(item=>Boolean(item.catalogId)).length;
  const registry=input.registry||[],publishedProducts=registry.filter(item=>item.recordType==="product").length,publishedReleases=registry.filter(item=>item.recordType==="release").length,publishedPackaging=registry.filter(item=>item.recordType==="packaging").length;
  const metrics:CoverageMetric[]=[
    {key:"source",label:"Attributable product sources",score:pct(sourced,total),numerator:sourced,denominator:catalog.length,detail:"Canonical cigar records with a product-level source.",href:"/industry/registry#canonical"},
    {key:"factory",label:"Exact factory coverage",score:pct(factories,total),numerator:factories,denominator:catalog.length,detail:"Product records naming the exact manufacturing location.",href:"/learn/manufacturing-truth"},
    {key:"blend",label:"Blend architecture",score:pct(blends,total),numerator:blends,denominator:catalog.length,detail:"Wrapper, binder, and filler are all documented.",href:"/learn/blending"},
    {key:"release",label:"Release history",score:pct(releases,total),numerator:releases,denominator:catalog.length,detail:`${publishedReleases} additional official release records are published.`,href:"/industry/registry#releases"},
    {key:"packaging",label:"Packaging history",score:pct(packaging,total),numerator:packaging,denominator:catalog.length,detail:`${publishedPackaging} official packaging revisions are published.`,href:"/industry/registry#packaging"},
    {key:"official",label:"Verified organization participation",score:Math.min(100,(input.profiles?.length||0)*10),numerator:input.profiles?.length||0,denominator:10,detail:`${publishedProducts} official product records supplied through governed workspaces.`,href:"/industry"},
    {key:"collector-provenance",label:"Private lot provenance",score:pct(provenance,owned),numerator:provenance,denominator:inventory.length,detail:"Owned lots with provenance notes or documents.",href:"/inventory-integrity"},
    {key:"collector-evidence",label:"Private lot documentation",score:Math.round((pct(images,owned)+pct(identity,owned))/2),numerator:images+identity,denominator:inventory.length*2,detail:"Photos and canonical identities strengthen the collector record.",href:"/inventory-integrity"},
  ];
  const overall=Math.round(metrics.reduce((sum,item)=>sum+item.score,0)/metrics.length);
  return{overall,metrics,canonical:{total:catalog.length,verified:records.filter(item=>item.status==="Verified foundation").length,developing:records.filter(item=>item.status==="Developing record").length,research:records.filter(item=>item.status==="Research required").length},principles:["Coverage never substitutes for accuracy.","Unknown facts remain visible.","Official, editorial, community, and AI sources remain distinct.","Corrections preserve the record instead of erasing it."]};
}
