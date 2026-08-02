import { z } from "zod";
import type { CatalogCigar } from "@/lib/types";
import { canonicalCigarIdentity, cigarProductKey } from "./cigar-identity";

export const CatalogDiscoverySchema = z.object({
  discoveries: z.array(z.object({
    brand:z.string().min(1), line:z.string().min(1), vitola:z.string().min(1), country:z.string(),
    factory:z.string(), brandOwner:z.string(), blender:z.string(),
    wrapper:z.string(), wrapperOrigin:z.string(), binder:z.string(), binderOrigin:z.string(),
    filler:z.string(), fillerOrigins:z.string(), dimensions:z.string(), strength:z.string(),
    packaging:z.string(), releaseYear:z.string(), edition:z.string(),
    entityType:z.enum(["Brand owner","Factory brand","Private label","Sub-brand","Unresolved"]),
    sourceUrl:z.string().url(), sourceTitle:z.string(), evidenceDate:z.string(), notes:z.string(),
    confidence:z.enum(["High","Medium","Low"]),
  })).max(40),
});
export type CatalogDiscoveryResult = z.infer<typeof CatalogDiscoverySchema>;
const discoveryStringFields=["brand","line","vitola","country","factory","brandOwner","blender","wrapper","wrapperOrigin","binder","binderOrigin","filler","fillerOrigins","dimensions","strength","packaging","releaseYear","edition","sourceUrl","sourceTitle","evidenceDate","notes"] as const;
export const catalogDiscoveryJsonSchema = {type:"object",additionalProperties:false,properties:{discoveries:{type:"array",maxItems:40,items:{type:"object",additionalProperties:false,properties:{...Object.fromEntries(discoveryStringFields.map(field=>[field,{type:"string"}])),entityType:{type:"string",enum:["Brand owner","Factory brand","Private label","Sub-brand","Unresolved"]},confidence:{type:"string",enum:["High","Medium","Low"]}},required:[...discoveryStringFields,"entityType","confidence"]}}},required:["discoveries"]} as const;

const key=(item:Pick<CatalogCigar,"brand"|"line"|"vitola">)=>cigarProductKey(item);
export function newCatalogDiscoveries(discoveries:CatalogDiscoveryResult["discoveries"],existing:CatalogCigar[]){const known=new Set(existing.map(key));return discoveries.filter(item=>!known.has(key(item))).filter((item,index,all)=>all.findIndex(candidate=>key(candidate)===key(item))===index)}
export function discoveryId(item:Pick<CatalogCigar,"brand"|"line"|"vitola">){return canonicalCigarIdentity(item).identityId.replace("CIG-","DISC-")}

function releasePart(value:string){return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
export function catalogDiscoveryReleaseKey(item:Pick<CatalogCigar,"brand"|"line">){return `${releasePart(item.brand)}|${releasePart(item.line)}`}
export type CatalogDiscoveryRelease={key:string;brand:string;line:string;items:CatalogCigar[]};
export function groupCatalogDiscoveries(items:CatalogCigar[]):CatalogDiscoveryRelease[]{
  const groups=new Map<string,CatalogDiscoveryRelease>();
  for(const item of items){
    const key=catalogDiscoveryReleaseKey(item);
    const existing=groups.get(key);
    if(existing)existing.items.push(item);
    else groups.set(key,{key,brand:item.brand,line:item.line,items:[item]});
  }
  return [...groups.values()]
    .map(group=>({...group,items:[...group.items].sort((a,b)=>a.vitola.localeCompare(b.vitola))}))
    .sort((a,b)=>a.brand.localeCompare(b.brand)||a.line.localeCompare(b.line));
}

export function discoveryNotes(item: CatalogDiscoveryResult["discoveries"][number]) {
  return [
    `Entity: ${item.entityType}`,
    `Owner: ${item.brandOwner || "Unresolved"}`,
    `Blender: ${item.blender || "Unresolved"}`,
    `Evidence: ${item.sourceTitle} (${item.evidenceDate})`,
    `Confidence: ${item.confidence}`,
    item.notes,
  ].join(" · ");
}
