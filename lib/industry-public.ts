import { partnerAdmin } from "@/lib/partner-platform";
import type { IndustryProfilePayload, IndustryPublicationPayload } from "@/lib/industry-hub";

export type PublicIndustryProfile={id:string;partnerId:string;slug:string;partnerType:string;trustLevel:"Official";publishedAt:string;payload:IndustryProfilePayload};
export type PublicIndustryPublication={id:string;partnerId:string;slug:string;organizationName:string;type:string;trustLevel:"Official";publishedAt:string;payload:IndustryPublicationPayload};
export type PublicIndustryRevision={id:string;entityType:string;entityId:string;action:string;source:"Official organization"|"Cedriva review";createdAt:string};

export async function loadPublicIndustry(){
  const admin=partnerAdmin();
  if(!admin)return{profiles:[] as PublicIndustryProfile[],publications:[] as PublicIndustryPublication[],revisions:[] as PublicIndustryRevision[]};
  const[profilesResult,publicationsResult,revisionsResult]=await Promise.all([
    admin.from("industry_profiles").select("id,partner_id,status,trust_level,published_payload,published_at,partners(slug,partner_type)").not("published_payload","is",null).neq("status","suspended").order("published_at",{ascending:false}),
    admin.from("industry_publications").select("id,partner_id,publication_type,status,trust_level,published_payload,published_at,partners(name,slug)").not("published_payload","is",null).neq("status","archived").order("published_at",{ascending:false}),
    admin.from("industry_revisions").select("id,entity_type,entity_id,action,actor,created_at").in("action",["founder.published","founder.suspended","founder.archived"]).order("created_at",{ascending:false}).limit(500),
  ]);
  if(profilesResult.error||publicationsResult.error||revisionsResult.error)return{profiles:[] as PublicIndustryProfile[],publications:[] as PublicIndustryPublication[],revisions:[] as PublicIndustryRevision[]};
  const profiles=(profilesResult.data||[]).map(row=>{const partner=row.partners as unknown as{slug:string;partner_type:string};return{id:row.id,partnerId:row.partner_id,slug:partner.slug,partnerType:partner.partner_type,trustLevel:"Official" as const,publishedAt:row.published_at,payload:row.published_payload as IndustryProfilePayload}});
  const publications=(publicationsResult.data||[]).map(row=>{const partner=row.partners as unknown as{name:string;slug:string};return{id:row.id,partnerId:row.partner_id,slug:partner.slug,organizationName:partner.name,type:row.publication_type,trustLevel:"Official" as const,publishedAt:row.published_at,payload:row.published_payload as IndustryPublicationPayload}});
  const revisions=(revisionsResult.data||[]).map(row=>({id:row.id,entityType:row.entity_type,entityId:row.entity_id,action:row.action,source:row.actor==="founder"?"Cedriva review" as const:"Official organization" as const,createdAt:row.created_at}));
  return{profiles,publications,revisions};
}
