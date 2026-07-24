import { z } from "zod";

const OptionalUrl=z.string().trim().url().max(1000).optional().or(z.literal(""));
const OptionalText=(max:number)=>z.string().trim().max(max).optional().or(z.literal(""));

export const IndustryProfileInput=z.object({
  partnerId:z.string().uuid(),
  displayName:z.string().trim().min(2).max(160),
  summary:z.string().trim().min(40).max(1200),
  history:z.string().trim().min(80).max(12000),
  foundedYear:z.coerce.number().int().min(1700).max(2200).optional().or(z.literal("")),
  headquarters:OptionalText(240),
  websiteUrl:OptionalUrl,
  publicContactUrl:OptionalUrl,
  logoUrl:OptionalUrl,
  heroImageUrl:OptionalUrl,
  factories:OptionalText(3000),
  masterBlenders:OptionalText(3000),
});

export const IndustryPublicationInput=z.object({
  partnerId:z.string().uuid(),
  publicationId:z.string().uuid().optional(),
  type:z.enum(["press_release","product_launch","limited_edition","event","factory_news","charity","award","education","blend_story","interview","packaging_change","counterfeit_alert","distribution_update"]),
  title:z.string().trim().min(8).max(220),
  summary:z.string().trim().min(30).max(1200),
  body:z.string().trim().min(100).max(30000),
  effectiveDate:z.string().date().optional().or(z.literal("")),
  canonicalSourceUrl:OptionalUrl,
  heroImageUrl:OptionalUrl,
});

export type IndustryProfilePayload=z.infer<typeof IndustryProfileInput>;
export type IndustryPublicationPayload=z.infer<typeof IndustryPublicationInput>;
export type IndustryStatus="draft"|"submitted"|"approved"|"published"|"changes_requested"|"suspended"|"archived";
export type IndustryTrustLevel="Official"|"Verified Historical"|"Expert"|"Community"|"AI";

export function publicationTypeLabel(type:string){
  return type.split("_").map(word=>word[0]?.toUpperCase()+word.slice(1)).join(" ");
}

export function industryCanSubmit(status:string){
  return["draft","changes_requested","published"].includes(status);
}

export function publicIndustryPayload<T>(row:{status:string;published_payload?:T|null}){
  return!["suspended","archived"].includes(row.status)&&row.published_payload?row.published_payload:undefined;
}

export function industryRevision(input:{partnerId:string;entityType:"profile"|"publication";entityId:string;action:string;actor:string;snapshot:unknown}){
  return{partner_id:input.partnerId,entity_type:input.entityType,entity_id:input.entityId,action:input.action,actor:input.actor,snapshot:input.snapshot};
}
