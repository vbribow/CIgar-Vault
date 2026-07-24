import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { partnerAdmin } from "@/lib/partner-platform";
import { CampaignInput, campaignLaunchBlockers, partnerCan, type PartnerRole } from "@/lib/partner-model";
import { PartnerInvitationInput, buildWorkspaceMetrics, createInvitationToken, invitationExpiresAt, safeMembership } from "@/lib/partner-workspace";
import { ReadinessSubmission, readinessSummary } from "@/lib/partner-readiness";
import { IndustryProfileInput, IndustryPublicationInput, industryCanSubmit, industryRevision } from "@/lib/industry-hub";
import { IndustryPackagingInput, IndustryProductInput, IndustryReleaseInput, registryCanSubmit, registryRevision } from "@/lib/industry-registry";

const WorkspaceRequest=z.discriminatedUnion("action",[
  z.object({action:z.literal("createCampaign"),data:CampaignInput}),
  z.object({action:z.literal("submitCampaign"),partnerId:z.string().uuid(),campaignId:z.string().uuid()}),
  z.object({action:z.literal("inviteMember"),data:PartnerInvitationInput}),
  z.object({action:z.literal("changeMemberRole"),partnerId:z.string().uuid(),membershipId:z.string().uuid(),role:z.enum(["owner","administrator","editor","analyst","viewer"])}),
  z.object({action:z.literal("revokeMember"),partnerId:z.string().uuid(),membershipId:z.string().uuid()}),
  z.object({action:z.literal("submitReadiness"),data:ReadinessSubmission}),
  z.object({action:z.literal("saveIndustryProfile"),data:IndustryProfileInput}),
  z.object({action:z.literal("submitIndustryProfile"),partnerId:z.string().uuid()}),
  z.object({action:z.literal("saveIndustryPublication"),data:IndustryPublicationInput}),
  z.object({action:z.literal("submitIndustryPublication"),partnerId:z.string().uuid(),publicationId:z.string().uuid()}),
  z.object({action:z.literal("saveIndustryProduct"),data:IndustryProductInput}),
  z.object({action:z.literal("saveIndustryRelease"),data:IndustryReleaseInput}),
  z.object({action:z.literal("saveIndustryPackaging"),data:IndustryPackagingInput}),
  z.object({action:z.literal("submitIndustryRegistry"),partnerId:z.string().uuid(),recordId:z.string().uuid()}),
]);

async function authenticatedUser(){
  if(!supabaseConfigured())return undefined;
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  return user||undefined;
}
function adminOrThrow(){
  const admin=partnerAdmin();
  if(!admin)throw new Error("Partner workspace database is not configured");
  return admin;
}

async function requireMembership(admin:ReturnType<typeof adminOrThrow>,userId:string,partnerId:string){
  const{data,error}=await admin.from("partner_memberships")
    .select("*,partners(id,name,slug,status,campaigns_locked,campaign_lock_reason,collaboration_locked,collaboration_lock_reason,disclosure_text)")
    .eq("user_id",userId).eq("partner_id",partnerId).eq("status","active").single();
  if(error)throw new Error("You do not have active access to this partner workspace");
  const partner=data.partners as unknown as Record<string,unknown>;
  if(partner.collaboration_locked)throw new Error(String(partner.collaboration_lock_reason||"This workspace is founder-locked"));
  return{membership:data,partner,role:data.role as PartnerRole};
}

export async function GET(){
  const user=await authenticatedUser();
  if(!user)return NextResponse.json({error:"Sign in to open a partner workspace"},{status:401});
  try{
    const admin=adminOrThrow();
    const{data:membershipRows,error:membershipError}=await admin.from("partner_memberships")
      .select("*,partners(id,name,slug,partner_type,status,campaigns_locked,collaboration_locked)")
      .eq("user_id",user.id).eq("status","active");
    if(membershipError)throw membershipError;
    const accessible=(membershipRows||[]).filter(row=>!(row.partners as unknown as{collaboration_locked?:boolean})?.collaboration_locked);
    if(!accessible.length)return NextResponse.json({data:{workspaces:[]}});
    const partnerIds=accessible.map(row=>row.partner_id);
    const[campaigns,clicks,attributions,conversions,commissions,members,readiness,industryProfiles,industryPublications,industryRegistry]=await Promise.all([
      admin.from("partner_campaigns").select("id,partner_id,name,code,channel,status,starts_at,ends_at,attribution_window_days,commission_type,commission_rate,hold_days,approved_at,activated_at").in("partner_id",partnerIds).order("created_at",{ascending:false}),
      admin.from("partner_clicks").select("campaign_id,partner_id").in("partner_id",partnerIds).limit(10000),
      admin.from("partner_attributions").select("campaign_id,partner_id").in("partner_id",partnerIds).limit(10000),
      admin.from("partner_conversions").select("campaign_id,partner_id,net_revenue_cents,status").in("partner_id",partnerIds).limit(10000),
      admin.from("partner_commissions").select("campaign_id,partner_id,amount_cents,status").in("partner_id",partnerIds).limit(10000),
      admin.from("partner_memberships").select("*").in("partner_id",partnerIds).neq("status","revoked").order("created_at",{ascending:true}),
      admin.from("partner_readiness_items").select("*").in("partner_id",partnerIds).order("created_at",{ascending:true}),
      admin.from("industry_profiles").select("*").in("partner_id",partnerIds),
      admin.from("industry_publications").select("*").in("partner_id",partnerIds).order("updated_at",{ascending:false}),
      admin.from("industry_registry_records").select("*").in("partner_id",partnerIds).order("updated_at",{ascending:false}),
    ]);
    const error=[campaigns,clicks,attributions,conversions,commissions,members,readiness,industryProfiles,industryPublications].find(result=>result.error)?.error;
    if(error)throw error;
    const now=new Date().toISOString();
    await admin.from("partner_memberships").update({last_accessed_at:now,updated_at:now}).in("id",accessible.map(row=>row.id));
    await admin.from("partner_audit_events").insert(accessible.map(row=>({partner_id:row.partner_id,actor:`partner:${user.id}`,action:"workspace.accessed",subject_type:"workspace",subject_id:row.partner_id,details:{role:row.role}})));
    const workspaces=accessible.map(row=>{
      const partner=row.partners as unknown as Record<string,unknown>;
      const ownCampaigns=(campaigns.data||[]).filter(item=>item.partner_id===row.partner_id);
      const role=row.role as PartnerRole;
      const ownReadiness=(readiness.data||[]).filter(item=>item.partner_id===row.partner_id);
      return{
        partner:{id:row.partner_id,name:String(partner.name),slug:String(partner.slug),partnerType:String(partner.partner_type),status:String(partner.status)},
        role,
        permissions:{
          createCampaign:partnerCan(role,"campaign.create"),editCampaign:partnerCan(role,"campaign.edit"),submitForReview:partnerCan(role,"campaign.review"),
          manageTeam:partnerCan(role,"partner.manage"),viewPayouts:partnerCan(role,"payouts.view"),approve:false,launch:false,pause:false,
          submitReadiness:partnerCan(role,"readiness.submit"),
        },
        campaigns:ownCampaigns,
        metrics:buildWorkspaceMetrics(ownCampaigns.map(item=>item.id),{
          clicks:(clicks.data||[]).filter(item=>item.partner_id===row.partner_id),
          attributions:(attributions.data||[]).filter(item=>item.partner_id===row.partner_id),
          conversions:(conversions.data||[]).filter(item=>item.partner_id===row.partner_id),
          commissions:(commissions.data||[]).filter(item=>item.partner_id===row.partner_id),
        }),
        members:(members.data||[]).filter(item=>item.partner_id===row.partner_id).map(item=>{
          const safe=safeMembership(item);
          return partnerCan(role,"partner.manage")?safe:{...safe,email:""};
        }),
        readiness:{items:ownReadiness,summary:readinessSummary(ownReadiness)},
        industry:{
          profile:(industryProfiles.data||[]).find(item=>item.partner_id===row.partner_id)||null,
          publications:(industryPublications.data||[]).filter(item=>item.partner_id===row.partner_id),
          registryRecords:industryRegistry.error?[]:(industryRegistry.data||[]).filter(item=>item.partner_id===row.partner_id),
        },
      };
    });
    return NextResponse.json({data:{workspaces}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Partner workspace unavailable"},{status:502});
  }
}

export async function POST(request:Request){
  const user=await authenticatedUser();
  if(!user)return NextResponse.json({error:"Sign in to collaborate"},{status:401});
  try{
    const input=WorkspaceRequest.parse(await request.json());
    const admin=adminOrThrow();
    let partnerId:string;
    switch(input.action){
      case"createCampaign":case"submitReadiness":case"saveIndustryProfile":case"saveIndustryPublication":case"saveIndustryProduct":case"saveIndustryRelease":case"saveIndustryPackaging":partnerId=input.data.partnerId;break;
      case"inviteMember":partnerId=input.data.partnerId;break;
      default:partnerId=input.partnerId;
    }
    const access=await requireMembership(admin,user.id,partnerId);
    if(input.action==="saveIndustryProduct"||input.action==="saveIndustryRelease"||input.action==="saveIndustryPackaging"){
      if(!partnerCan(access.role,"readiness.submit"))throw new Error("Your role cannot edit official registry records");
      const recordType=input.action==="saveIndustryProduct"?"product":input.action==="saveIndustryRelease"?"release":"packaging";
      const payload={...input.data,partnerId:undefined,recordId:undefined},now=new Date().toISOString();
      let data;
      if(input.data.recordId){
        const{data:existing,error:lookupError}=await admin.from("industry_registry_records").select("*").eq("id",input.data.recordId).eq("partner_id",partnerId).eq("record_type",recordType).single();
        if(lookupError)throw lookupError;
        if(!registryCanSubmit(existing.status))throw new Error("This registry record is locked while Cedriva reviews it");
        const result=await admin.from("industry_registry_records").update({status:"draft",draft_payload:payload,review_note:null,reviewed_by:null,submitted_at:null,approved_at:null,updated_at:now}).eq("id",existing.id).select().single();
        if(result.error)throw result.error;data=result.data;
      }else{
        const result=await admin.from("industry_registry_records").insert({partner_id:partnerId,record_type:recordType,status:"draft",trust_level:"Official",draft_payload:payload,created_by:user.id}).select().single();
        if(result.error)throw result.error;data=result.data;
      }
      await admin.from("industry_registry_revisions").insert(registryRevision({partnerId,recordId:data.id,recordType,action:"draft.saved",actor:`partner:${user.id}`,snapshot:payload}));
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:`industry.${recordType}_draft_saved`,subject_type:"industry_registry",subject_id:data.id,details:{recordType}});
      return NextResponse.json({data});
    }
    if(input.action==="submitIndustryRegistry"){
      const{data:item,error:itemError}=await admin.from("industry_registry_records").select("*").eq("id",input.recordId).eq("partner_id",partnerId).single();
      if(itemError)throw itemError;
      if(!registryCanSubmit(item.status))throw new Error("This registry record cannot be submitted from its current status");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("industry_registry_records").update({status:"submitted",submitted_at:now,review_note:null,updated_at:now}).eq("id",item.id).select().single();
      if(error)throw error;
      await admin.from("industry_registry_revisions").insert(registryRevision({partnerId,recordId:data.id,recordType:data.record_type,action:"submitted",actor:`partner:${user.id}`,snapshot:data.draft_payload}));
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"industry.registry_submitted",subject_type:"industry_registry",subject_id:data.id,details:{recordType:data.record_type}});
      return NextResponse.json({data});
    }
    if(input.action==="saveIndustryProfile"){
      if(!partnerCan(access.role,"readiness.submit"))throw new Error("Your role cannot edit the official organization profile");
      const{data:existing}=await admin.from("industry_profiles").select("*").eq("partner_id",partnerId).maybeSingle();
      if(existing&&!industryCanSubmit(existing.status))throw new Error("This profile is locked while Cedriva reviews it");
      const now=new Date().toISOString(),payload={...input.data,partnerId:undefined};
      const{data,error}=await admin.from("industry_profiles").upsert({
        partner_id:partnerId,status:"draft",trust_level:"Official",draft_payload:payload,
        review_note:null,reviewed_by:null,submitted_at:null,approved_at:null,updated_at:now,
      },{onConflict:"partner_id"}).select().single();
      if(error)throw error;
      await admin.from("industry_revisions").insert(industryRevision({partnerId,entityType:"profile",entityId:data.id,action:"draft.saved",actor:`partner:${user.id}`,snapshot:payload}));
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"industry.profile_draft_saved",subject_type:"industry_profile",subject_id:data.id,details:{}});
      return NextResponse.json({data});
    }
    if(input.action==="submitIndustryProfile"){
      const{data:profile,error:profileError}=await admin.from("industry_profiles").select("*").eq("partner_id",partnerId).single();
      if(profileError)throw profileError;
      if(!industryCanSubmit(profile.status))throw new Error("This profile cannot be submitted from its current status");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("industry_profiles").update({status:"submitted",submitted_at:now,review_note:null,updated_at:now}).eq("id",profile.id).select().single();
      if(error)throw error;
      await admin.from("industry_revisions").insert(industryRevision({partnerId,entityType:"profile",entityId:data.id,action:"submitted",actor:`partner:${user.id}`,snapshot:data.draft_payload}));
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"industry.profile_submitted",subject_type:"industry_profile",subject_id:data.id,details:{}});
      return NextResponse.json({data});
    }
    if(input.action==="saveIndustryPublication"){
      if(!partnerCan(access.role,"readiness.submit"))throw new Error("Your role cannot prepare official newsroom content");
      const payload={...input.data,partnerId:undefined,publicationId:undefined},now=new Date().toISOString();
      let data;
      if(input.data.publicationId){
        const{data:existing,error:lookupError}=await admin.from("industry_publications").select("*").eq("id",input.data.publicationId).eq("partner_id",partnerId).single();
        if(lookupError)throw lookupError;
        if(!industryCanSubmit(existing.status))throw new Error("This publication is locked while Cedriva reviews it");
        const result=await admin.from("industry_publications").update({publication_type:input.data.type,status:"draft",draft_payload:payload,review_note:null,reviewed_by:null,submitted_at:null,approved_at:null,updated_at:now}).eq("id",existing.id).select().single();
        if(result.error)throw result.error;data=result.data;
      }else{
        const result=await admin.from("industry_publications").insert({partner_id:partnerId,publication_type:input.data.type,status:"draft",trust_level:"Official",draft_payload:payload,created_by:user.id}).select().single();
        if(result.error)throw result.error;data=result.data;
      }
      await admin.from("industry_revisions").insert(industryRevision({partnerId,entityType:"publication",entityId:data.id,action:"draft.saved",actor:`partner:${user.id}`,snapshot:payload}));
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"industry.publication_draft_saved",subject_type:"industry_publication",subject_id:data.id,details:{type:data.publication_type}});
      return NextResponse.json({data});
    }
    if(input.action==="submitIndustryPublication"){
      const{data:item,error:itemError}=await admin.from("industry_publications").select("*").eq("id",input.publicationId).eq("partner_id",partnerId).single();
      if(itemError)throw itemError;
      if(!industryCanSubmit(item.status))throw new Error("This publication cannot be submitted from its current status");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("industry_publications").update({status:"submitted",submitted_at:now,review_note:null,updated_at:now}).eq("id",item.id).select().single();
      if(error)throw error;
      await admin.from("industry_revisions").insert(industryRevision({partnerId,entityType:"publication",entityId:data.id,action:"submitted",actor:`partner:${user.id}`,snapshot:data.draft_payload}));
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"industry.publication_submitted",subject_type:"industry_publication",subject_id:data.id,details:{type:data.publication_type}});
      return NextResponse.json({data});
    }
    if(input.action==="submitReadiness"){
      if(!partnerCan(access.role,"readiness.submit"))throw new Error("Your role cannot submit readiness evidence");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_readiness_items").update({
        status:"submitted",partner_note:input.data.note,evidence_url:input.data.evidenceUrl||null,
        submitted_by:user.id,submitted_at:now,founder_note:null,reviewed_by:null,reviewed_at:null,updated_at:now,
      }).eq("id",input.data.itemId).eq("partner_id",partnerId).in("status",["pending","submitted","changes_requested"]).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"partner.readiness_submitted",subject_type:"readiness",subject_id:data.id,details:{itemKey:data.item_key,evidenceProvided:Boolean(input.data.evidenceUrl)}});
      return NextResponse.json({data});
    }
    if(input.action==="createCampaign"){
      if(!partnerCan(access.role,"campaign.create"))throw new Error("Your role cannot create campaigns");
      if(access.partner.campaigns_locked)throw new Error(String(access.partner.campaign_lock_reason||"Campaign work is founder-locked"));
      const{data,error}=await admin.from("partner_campaigns").insert({
        partner_id:partnerId,name:input.data.name,code:input.data.code,channel:input.data.channel,destination_path:input.data.destinationPath,
        attribution_window_days:input.data.attributionWindowDays,commission_type:input.data.commissionType,commission_rate:input.data.commissionRate,
        hold_days:input.data.holdDays,starts_at:input.data.startsAt,ends_at:input.data.endsAt,terms_confirmed:input.data.termsConfirmed,
        disclosure_approved:input.data.disclosureApproved,audience_consent_confirmed:input.data.audienceConsentConfirmed,privacy_reviewed:input.data.privacyReviewed,status:"draft",
      }).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partnerId,campaign_id:data.id,actor:`partner:${user.id}`,action:"campaign.partner_draft_created",subject_type:"campaign",subject_id:data.id,details:{role:access.role,code:data.code}});
      return NextResponse.json({data},{status:201});
    }
    if(input.action==="submitCampaign"){
      if(!partnerCan(access.role,"campaign.review"))throw new Error("Your role cannot submit campaigns for founder review");
      const{data:campaign,error:campaignError}=await admin.from("partner_campaigns").select("*").eq("id",input.campaignId).eq("partner_id",partnerId).single();
      if(campaignError)throw campaignError;
      if(!["draft","paused"].includes(campaign.status))throw new Error("Only draft or paused campaigns can return to founder review");
      const blockers=campaignLaunchBlockers({
        partnerStatus:String(access.partner.status),campaignsLocked:Boolean(access.partner.campaigns_locked),disclosureText:String(access.partner.disclosure_text||""),
        commissionRate:Number(campaign.commission_rate),startsAt:campaign.starts_at,endsAt:campaign.ends_at,termsConfirmed:Boolean(campaign.terms_confirmed),
        disclosureApproved:Boolean(campaign.disclosure_approved),audienceConsentConfirmed:Boolean(campaign.audience_consent_confirmed),privacyReviewed:Boolean(campaign.privacy_reviewed),
      });
      if(blockers.length)throw new Error(`Campaign is incomplete: ${blockers.join("; ")}`);
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_campaigns").update({status:"review",approved_at:null,approved_by:null,approval_note:null,approval_fingerprint:null,activated_at:null,updated_at:now}).eq("id",campaign.id).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partnerId,campaign_id:campaign.id,actor:`partner:${user.id}`,action:"campaign.partner_submitted_for_review",subject_type:"campaign",subject_id:campaign.id,details:{role:access.role}});
      return NextResponse.json({data});
    }
    if(input.action==="inviteMember"){
      if(!partnerCan(access.role,"partner.manage"))throw new Error("Only a workspace owner can invite team members");
      const{token,hash}=createInvitationToken(),expiresAt=invitationExpiresAt(input.data.expiresInDays);
      const{data,error}=await admin.from("partner_memberships").insert({partner_id:partnerId,invited_email:input.data.email,display_name:input.data.displayName,role:input.data.role,status:"invited",invited_by:user.id,invitation_token_hash:hash,invitation_expires_at:expiresAt}).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"membership.invited",subject_type:"membership",subject_id:data.id,details:{role:data.role,expiresAt}});
      return NextResponse.json({data:{...safeMembership(data),invitationPath:`/partners/invite/${token}`}},{status:201});
    }
    const{data:target,error:targetError}=await admin.from("partner_memberships").select("*").eq("id",input.membershipId).eq("partner_id",partnerId).single();
    if(targetError)throw targetError;
    if(!partnerCan(access.role,"partner.manage"))throw new Error("Only a workspace owner can manage team roles");
    if(target.user_id===user.id)throw new Error("Ask the Cedriva founder to change or revoke your own owner access");
    if(input.action==="changeMemberRole"){
      const{data,error}=await admin.from("partner_memberships").update({role:input.role,updated_at:new Date().toISOString()}).eq("id",target.id).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"membership.role_changed",subject_type:"membership",subject_id:data.id,details:{role:data.role}});
      return NextResponse.json({data:safeMembership(data)});
    }
    const now=new Date().toISOString();
    const{data,error}=await admin.from("partner_memberships").update({status:"revoked",revoked_at:now,invitation_token_hash:null,updated_at:now}).eq("id",target.id).select().single();
    if(error)throw error;
    await admin.from("partner_audit_events").insert({partner_id:partnerId,actor:`partner:${user.id}`,action:"membership.revoked",subject_type:"membership",subject_id:data.id,details:{}});
    return NextResponse.json({data:safeMembership(data)});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Invalid workspace operation"},{status:422});
  }
}
