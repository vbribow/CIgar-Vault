import { z } from "zod";

const OptionalUrl=z.string().trim().url().max(1000).optional().or(z.literal(""));
const OptionalText=(max:number)=>z.string().trim().max(max).optional().or(z.literal(""));
const RequiredText=(min:number,max:number)=>z.string().trim().min(min).max(max);

export const IndustryProductInput=z.object({
  partnerId:z.string().uuid(),
  recordId:z.string().uuid().optional(),
  brand:RequiredText(2,160),
  line:RequiredText(2,180),
  description:RequiredText(40,3000),
  productionStatus:z.enum(["current","limited","seasonal","discontinued","historical"]),
  factory:OptionalText(240),
  blender:OptionalText(240),
  country:OptionalText(120),
  wrapper:OptionalText(240),
  binder:OptionalText(240),
  filler:OptionalText(500),
  strength:OptionalText(80),
  officialProductUrl:OptionalUrl,
});

export const IndustryReleaseInput=z.object({
  partnerId:z.string().uuid(),
  recordId:z.string().uuid().optional(),
  productName:RequiredText(4,300),
  releaseName:RequiredText(4,300),
  releaseType:z.enum(["regular_production","limited_edition","annual","regional","retailer_exclusive","event_exclusive","historical"]),
  releaseDate:z.string().date(),
  availabilityStatus:z.enum(["announced","shipping","available","sold_out","retired","historical"]),
  vitolas:RequiredText(2,2000),
  msrp:OptionalText(500),
  productionQuantity:OptionalText(500),
  markets:OptionalText(1000),
  officialReleaseUrl:OptionalUrl,
  notes:OptionalText(4000),
});

export const IndustryPackagingInput=z.object({
  partnerId:z.string().uuid(),
  recordId:z.string().uuid().optional(),
  productName:RequiredText(4,300),
  artifactType:z.enum(["band","box","bundle","seal","cellophane","tube","humidor","other"]),
  revisionName:RequiredText(3,240),
  effectiveFrom:z.string().date(),
  effectiveTo:z.string().date().optional().or(z.literal("")),
  description:RequiredText(40,4000),
  boxCount:OptionalText(120),
  boxCodeGuidance:OptionalText(2000),
  authenticationGuidance:OptionalText(4000),
  counterfeitWarning:OptionalText(4000),
  officialSourceUrl:OptionalUrl,
  imageUrl:OptionalUrl,
});

export type IndustryProductPayload=z.infer<typeof IndustryProductInput>;
export type IndustryReleasePayload=z.infer<typeof IndustryReleaseInput>;
export type IndustryPackagingPayload=z.infer<typeof IndustryPackagingInput>;
export type IndustryRegistryPayload=IndustryProductPayload|IndustryReleasePayload|IndustryPackagingPayload;
export type IndustryRegistryType="product"|"release"|"packaging";
export type IndustryRegistryStatus="draft"|"submitted"|"approved"|"published"|"changes_requested"|"archived";

export function registrySchema(type:IndustryRegistryType){
  return type==="product"?IndustryProductInput:type==="release"?IndustryReleaseInput:IndustryPackagingInput;
}

export function registryTitle(type:IndustryRegistryType,payload:Record<string,unknown>){
  if(type==="product")return`${String(payload.brand||"")} ${String(payload.line||"")}`.trim()||"Untitled product";
  if(type==="release")return String(payload.releaseName||payload.productName||"Untitled release");
  return String(payload.revisionName||payload.productName||"Untitled packaging revision");
}

export function registryCanSubmit(status:string){
  return["draft","changes_requested","published"].includes(status);
}

export function registryRevision(input:{partnerId:string;recordId:string;recordType:IndustryRegistryType;action:string;actor:string;snapshot:unknown}){
  return{partner_id:input.partnerId,record_id:input.recordId,record_type:input.recordType,action:input.action,actor:input.actor,snapshot:input.snapshot};
}
