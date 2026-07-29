import { buildCanonicalCigarRecord } from "./canonical-cigar-record";
import type { PublicIndustryRegistryRecord } from "./industry-public";
import type { CatalogCigar, InventoryItem } from "./types";

export type ProvenanceNodeType="Brand"|"Cigar"|"Vitola"|"Blend"|"Factory"|"Release"|"Packaging"|"Evidence"|"Collector lot";
export type ProvenanceNode={id:string;type:ProvenanceNodeType;label:string;detail:string;trust:"Official"|"Evidence-aware"|"Private";href?:string};
export type ProvenanceEdge={from:string;to:string;relationship:string};
export type ProvenanceGraph={nodes:ProvenanceNode[];edges:ProvenanceEdge[];completion:number;missing:string[]};

const slug=(value:string)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export function buildProvenanceGraph(catalog:CatalogCigar,inventory:InventoryItem[],registry:PublicIndustryRegistryRecord[]=[]):ProvenanceGraph{
  const canonical=buildCanonicalCigarRecord(catalog,inventory);
  const nodes:ProvenanceNode[]=[];const edges:ProvenanceEdge[]=[];
  const add=(node:ProvenanceNode)=>{if(!nodes.some(item=>item.id===node.id))nodes.push(node)};
  const connect=(from:string,to:string,relationship:string)=>edges.push({from,to,relationship});
  const brandId=`brand-${slug(catalog.brand)}`,cigarId=`cigar-${slug(`${catalog.brand}-${catalog.line}`)}`,vitolaId=`vitola-${slug(`${catalog.brand}-${catalog.line}-${catalog.vitola}`)}`;
  add({id:brandId,type:"Brand",label:catalog.brand,detail:"Commercial brand identity",trust:"Evidence-aware"});
  add({id:cigarId,type:"Cigar",label:catalog.line,detail:"Canonical product family",trust:"Evidence-aware",href:`/catalog/${encodeURIComponent(catalog.catalogId)}`});connect(brandId,cigarId,"offers");
  add({id:vitolaId,type:"Vitola",label:catalog.vitola,detail:catalog.dimensions||"Dimensions need evidence",trust:"Evidence-aware"});connect(cigarId,vitolaId,"is expressed as");
  if(catalog.wrapper||catalog.binder||catalog.filler){const id=`blend-${slug(catalog.catalogId)}`;add({id,type:"Blend",label:[catalog.wrapper,catalog.binder,catalog.filler].filter(Boolean).join(" · "),detail:"Wrapper · binder · filler",trust:"Evidence-aware"});connect(cigarId,id,"is composed from")}
  if(catalog.factory){const id=`factory-${slug(catalog.factory)}`;add({id,type:"Factory",label:catalog.factory,detail:catalog.country||"Country not documented",trust:"Evidence-aware"});connect(cigarId,id,"is manufactured at")}
  const searchName=`${catalog.brand} ${catalog.line}`.toLowerCase();
  for(const item of registry.filter(item=>String((item.payload as Record<string,unknown>).productName||(item.payload as Record<string,unknown>).brand||"").toLowerCase().includes(catalog.brand.toLowerCase())||String((item.payload as Record<string,unknown>).releaseName||"").toLowerCase().includes(searchName))){
    const payload=item.payload as Record<string,unknown>,id=`official-${item.id}`;
    if(item.recordType==="release"){add({id,type:"Release",label:String(payload.releaseName||"Official release"),detail:String(payload.releaseDate||"Dated official record"),trust:"Official",href:`/industry/registry#releases`});connect(cigarId,id,"has official release")}
    if(item.recordType==="packaging"){add({id,type:"Packaging",label:String(payload.revisionName||"Official artifact"),detail:String(payload.effectiveFrom||"Dated official record"),trust:"Official",href:`/industry/registry#packaging`});connect(cigarId,id,"uses official artifact")}
  }
  canonical.evidence.forEach((item,index)=>{const id=`evidence-${slug(catalog.catalogId)}-${index}`;add({id,type:"Evidence",label:item.sourceName,detail:`${item.sourceType} · ${item.confidence}`,trust:"Evidence-aware",href:item.sourceUrl});connect(cigarId,id,"is supported by")});
  canonical.ownedLots.forEach(item=>{const id=`lot-${item.inventoryId}`;add({id,type:"Collector lot",label:`${item.currentQty??"?"} × ${item.vitola}`,detail:[item.vintage,item.boxCode,item.storageLocationId].filter(Boolean).join(" · ")||"Private collection record",trust:"Private",href:`/inventory/${item.inventoryId}`});connect(vitolaId,id,"is documented in")});
  const expected:ProvenanceNodeType[]=["Brand","Cigar","Vitola","Blend","Factory","Release","Packaging","Evidence","Collector lot"];
  const present=new Set(nodes.map(node=>node.type));const missing=expected.filter(type=>!present.has(type));
  return{nodes,edges,completion:Math.round((expected.length-missing.length)/expected.length*100),missing};
}

export function provenanceModel(){
  return[
    {type:"Brand" as const,promise:"Who presents the cigar to collectors."},
    {type:"Cigar" as const,promise:"The stable product family across time."},
    {type:"Vitola" as const,promise:"The named size and physical dimensions."},
    {type:"Blend" as const,promise:"Wrapper, binder, filler, seed, treatment, and origin."},
    {type:"Factory" as const,promise:"Who manufactured this exact product and when."},
    {type:"Release" as const,promise:"The dated edition, market, quantity, and original price."},
    {type:"Packaging" as const,promise:"Bands, boxes, seals, codes, and revision history."},
    {type:"Evidence" as const,promise:"What supports each claim and with what confidence."},
    {type:"Collector lot" as const,promise:"Private acquisition, storage, condition, value, and custody."},
  ];
}
