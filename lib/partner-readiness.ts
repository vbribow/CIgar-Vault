import { z } from "zod";

export const readinessDefinitions=[
  {key:"organization_identity",category:"Trust",title:"Organization identity",description:"Confirm the legal organization name, official website, and primary business location."},
  {key:"authorized_contact",category:"Trust",title:"Authorized representative",description:"Confirm that the primary contact is authorized to represent the organization."},
  {key:"brand_profile",category:"Brand",title:"Official brand profile",description:"Approve the organization story, logo rights, public contact information, and factual profile details."},
  {key:"partnership_terms",category:"Commercial",title:"Partnership terms",description:"Document scope, responsibilities, term, termination, and the platform’s editorial independence."},
  {key:"privacy_data_use",category:"Trust",title:"Privacy and data use",description:"Confirm first-party attribution, aggregate reporting, consent requirements, and no access to private collector records."},
  {key:"public_disclosure",category:"Trust",title:"Public disclosure",description:"Approve plain-language compensation and relationship disclosures before any promotion."},
  {key:"editorial_independence",category:"Trust",title:"Editorial and ranking independence",description:"Confirm that compensation cannot influence search inclusion, listing order, evidence status, price normalization, reviews, or recommendations."},
  {key:"age_jurisdiction",category:"Legal",title:"Age and jurisdiction controls",description:"Confirm the adult-only experience, retailer age verification, shipping restrictions, and applicable federal, state, local, and international requirements."},
  {key:"legal_review",category:"Legal",title:"Legal and regulatory review",description:"Obtain context-specific review of affiliate disclosures, tobacco marketing, privacy, tax, and program terms before activation."},
  {key:"attribution_plan",category:"Operations",title:"Attribution plan",description:"Document approved channels, attribution window, destination, campaign owner, and measurement boundaries."},
  {key:"commission_payout",category:"Commercial",title:"Commission and payout process",description:"Approve rate, hold period, statement cadence, and payment contact. Never store bank or tax credentials here."},
  {key:"launch_materials",category:"Launch",title:"Launch materials and support",description:"Approve factual copy, imagery rights, support path, pause procedure, and final launch owner."},
] as const;

export type ReadinessKey=typeof readinessDefinitions[number]["key"];
export type ReadinessStatus="pending"|"submitted"|"approved"|"changes_requested"|"waived";

export const ReadinessSubmission=z.object({
  partnerId:z.string().uuid(),
  itemId:z.string().uuid(),
  note:z.string().trim().min(10).max(2000),
  evidenceUrl:z.string().url().max(1000).optional().or(z.literal("")),
});

export const ReadinessReview=z.object({
  itemId:z.string().uuid(),
  status:z.enum(["approved","changes_requested","waived"]),
  founderNote:z.string().trim().min(10).max(2000),
});

export type ReadinessRow={
  id:string;
  partner_id:string;
  item_key:ReadinessKey;
  category:string;
  title:string;
  description:string;
  required:boolean;
  status:ReadinessStatus;
  partner_note?:string|null;
  evidence_url?:string|null;
  founder_note?:string|null;
  submitted_at?:string|null;
  reviewed_at?:string|null;
  updated_at:string;
};

export function readinessSummary(rows:Pick<ReadinessRow,"required"|"status">[]){
  const required=rows.filter(row=>row.required);
  const approved=required.filter(row=>row.status==="approved"||row.status==="waived").length;
  return{approved,required:required.length,complete:required.length===readinessDefinitions.length&&approved===required.length};
}

export function readinessSeedRows(partnerId:string){
  return readinessDefinitions.map(item=>({
    partner_id:partnerId,
    item_key:item.key,
    category:item.category,
    title:item.title,
    description:item.description,
    required:true,
    status:"pending" as const,
  }));
}
