import { z } from "zod";
import type { CatalogCigar } from "@/lib/types";
import { canonicalCigarIdentity, cigarProductKey } from "./cigar-identity";

export const CatalogDiscoverySchema = z.object({
  discoveries: z.array(z.object({
    brand:z.string().min(1), line:z.string().min(1), vitola:z.string().min(1), country:z.string(),
    factory:z.string(), brandOwner:z.string(), blender:z.string(),
    entityType:z.enum(["Brand owner","Factory brand","Private label","Sub-brand","Unresolved"]),
    sourceUrl:z.string().url(), sourceTitle:z.string(), evidenceDate:z.string(), notes:z.string(),
    confidence:z.enum(["High","Medium","Low"]),
  })).max(40),
});
export type CatalogDiscoveryResult = z.infer<typeof CatalogDiscoverySchema>;
export const catalogDiscoveryJsonSchema = {type:"object",additionalProperties:false,properties:{discoveries:{type:"array",maxItems:40,items:{type:"object",additionalProperties:false,properties:{brand:{type:"string"},line:{type:"string"},vitola:{type:"string"},country:{type:"string"},factory:{type:"string"},brandOwner:{type:"string"},blender:{type:"string"},entityType:{type:"string",enum:["Brand owner","Factory brand","Private label","Sub-brand","Unresolved"]},sourceUrl:{type:"string"},sourceTitle:{type:"string"},evidenceDate:{type:"string"},notes:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]}},required:["brand","line","vitola","country","factory","brandOwner","blender","entityType","sourceUrl","sourceTitle","evidenceDate","notes","confidence"]}}},required:["discoveries"]} as const;

const key=(item:Pick<CatalogCigar,"brand"|"line"|"vitola">)=>cigarProductKey(item);
export function newCatalogDiscoveries(discoveries:CatalogDiscoveryResult["discoveries"],existing:CatalogCigar[]){const known=new Set(existing.map(key));return discoveries.filter(item=>!known.has(key(item))).filter((item,index,all)=>all.findIndex(candidate=>key(candidate)===key(item))===index)}
export function discoveryId(item:Pick<CatalogCigar,"brand"|"line"|"vitola">){return canonicalCigarIdentity(item).identityId.replace("CIG-","DISC-")}

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
