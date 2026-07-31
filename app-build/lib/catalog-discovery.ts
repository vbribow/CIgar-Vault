import { z } from "zod";
import type { CatalogCigar } from "@/lib/types";
import { canonicalCigarIdentity } from "./cigar-identity";

export const CatalogDiscoverySchema = z.object({
  discoveries: z.array(z.object({
    brand:z.string().min(1), line:z.string().min(1), vitola:z.string().min(1), country:z.string(),
    factory:z.string(), brandOwner:z.string(), blender:z.string(),
    wrapper:z.string().default("Unresolved"), binder:z.string().default("Unresolved"), filler:z.string().default("Unresolved"), wrapperOrigin:z.string().default("Unresolved"), binderOrigin:z.string().default("Unresolved"), fillerOrigins:z.string().default("Unresolved"),
    dimensions:z.string().default("Unresolved"), strength:z.string().default("Unresolved"), releaseYear:z.string().default("Unresolved"), edition:z.string().default("Unresolved"), packaging:z.string().default("Unresolved"),
    entityType:z.enum(["Brand owner","Factory brand","Private label","Sub-brand","Unresolved"]),
    sourceUrl:z.string().url(), sourceTitle:z.string(), evidenceDate:z.string(), notes:z.string(),
    confidence:z.enum(["High","Medium","Low"]),
  })).max(40),
});
export type CatalogDiscoveryResult = z.infer<typeof CatalogDiscoverySchema>;
export const catalogDiscoveryJsonSchema = {type:"object",additionalProperties:false,properties:{discoveries:{type:"array",maxItems:40,items:{type:"object",additionalProperties:false,properties:{brand:{type:"string"},line:{type:"string"},vitola:{type:"string"},country:{type:"string"},factory:{type:"string"},brandOwner:{type:"string"},blender:{type:"string"},wrapper:{type:"string"},binder:{type:"string"},filler:{type:"string"},wrapperOrigin:{type:"string"},binderOrigin:{type:"string"},fillerOrigins:{type:"string"},dimensions:{type:"string"},strength:{type:"string"},releaseYear:{type:"string"},edition:{type:"string"},packaging:{type:"string"},entityType:{type:"string",enum:["Brand owner","Factory brand","Private label","Sub-brand","Unresolved"]},sourceUrl:{type:"string"},sourceTitle:{type:"string"},evidenceDate:{type:"string"},notes:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]}},required:["brand","line","vitola","country","factory","brandOwner","blender","wrapper","binder","filler","wrapperOrigin","binderOrigin","fillerOrigins","dimensions","strength","releaseYear","edition","packaging","entityType","sourceUrl","sourceTitle","evidenceDate","notes","confidence"]}}},required:["discoveries"]} as const;

const key=(item:Pick<CatalogCigar,"brand"|"line"|"vitola"|"releaseYear">)=>canonicalCigarIdentity({...item,vintage:item.releaseYear}).identityKey;
export function newCatalogDiscoveries(discoveries:CatalogDiscoveryResult["discoveries"],existing:CatalogCigar[]){const known=new Set(existing.map(key));return discoveries.filter(item=>!known.has(key(item))).filter((item,index,all)=>all.findIndex(candidate=>key(candidate)===key(item))===index)}
export function discoveryId(item:Pick<CatalogCigar,"brand"|"line"|"vitola"|"releaseYear">){return canonicalCigarIdentity({...item,vintage:item.releaseYear}).identityId.replace("CIG-","DISC-")}

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
