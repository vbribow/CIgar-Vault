import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { CampaignInput, PartnerInput, campaignLaunchBlockers } from "@/lib/partner-model";
import { partnerAdmin } from "@/lib/partner-platform";
import { PartnerInvitationInput, createInvitationToken, invitationExpiresAt, safeMembership } from "@/lib/partner-workspace";
import { ReadinessReview, readinessSeedRows, readinessSummary } from "@/lib/partner-readiness";

const RequestBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("createPartner"), data: PartnerInput }),
  z.object({ action: z.literal("createCampaign"), data: CampaignInput }),
  z.object({
    action: z.literal("setStatus"),
    entity: z.enum(["partner", "commission"]),
    id: z.string().uuid(),
    status: z.enum(["draft", "active", "paused", "ended", "pending", "approved", "void", "paid"]),
  }),
  z.object({ action:z.literal("submitCampaign"),id:z.string().uuid() }),
  z.object({ action:z.literal("approveCampaign"),id:z.string().uuid(),confirmation:z.string(),note:z.string().trim().min(10).max(1000) }),
  z.object({ action:z.literal("launchCampaign"),id:z.string().uuid(),confirmation:z.string() }),
  z.object({ action:z.literal("pauseCampaign"),id:z.string().uuid(),confirmation:z.string(),emergency:z.boolean().default(false) }),
  z.object({ action:z.literal("emergencyPausePartner"),id:z.string().uuid(),confirmation:z.string() }),
  z.object({ action:z.literal("unlockPartnerCampaigns"),id:z.string().uuid(),confirmation:z.string(),note:z.string().trim().min(10).max(1000) }),
  z.object({action:z.literal("inviteMember"),data:PartnerInvitationInput}),
  z.object({action:z.literal("changeMemberRole"),id:z.string().uuid(),role:z.enum(["owner","administrator","editor","analyst","viewer"])}),
  z.object({action:z.literal("revokeMember"),id:z.string().uuid()}),
  z.object({action:z.literal("initializeReadiness"),partnerId:z.string().uuid()}),
  z.object({action:z.literal("reviewReadiness"),partnerId:z.string().uuid(),data:ReadinessReview}),
  z.object({
    action: z.literal("createPayout"),
    partnerId: z.string().uuid(),
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
    paymentReference: z.string().trim().max(200).optional(),
  }),
  z.object({
    action: z.literal("markPayoutPaid"),
    id: z.string().uuid(),
    paymentReference: z.string().trim().min(2).max(200),
  }),
]);

function adminOrThrow() {
  const admin = partnerAdmin();
  if (!admin) throw new Error("Partner platform requires Supabase service credentials");
  return admin;
}

type CampaignRow=Record<string,unknown>&{id:string;partner_id:string;code:string;status:string;commission_rate:number;starts_at?:string|null;ends_at?:string|null;terms_confirmed:boolean;disclosure_approved:boolean;audience_consent_confirmed:boolean;privacy_reviewed:boolean;approval_fingerprint?:string|null;partners:{status:string;campaigns_locked:boolean;disclosure_text?:string|null;slug:string;name:string}};

function campaignFingerprint(campaign:CampaignRow){
  return createHash("sha256").update(JSON.stringify({
    partnerId:campaign.partner_id,code:campaign.code,channel:campaign.channel,destinationPath:campaign.destination_path,
    attributionWindowDays:campaign.attribution_window_days,commissionType:campaign.commission_type,commissionRate:Number(campaign.commission_rate),
    holdDays:campaign.hold_days,startsAt:campaign.starts_at,endsAt:campaign.ends_at,termsConfirmed:campaign.terms_confirmed,
    disclosureApproved:campaign.disclosure_approved,audienceConsentConfirmed:campaign.audience_consent_confirmed,privacyReviewed:campaign.privacy_reviewed,
    disclosureText:campaign.partners.disclosure_text,
  })).digest("hex");
}

function launchBlockers(campaign:CampaignRow){
  return campaignLaunchBlockers({
    partnerStatus:campaign.partners.status,campaignsLocked:campaign.partners.campaigns_locked,disclosureText:campaign.partners.disclosure_text,
    commissionRate:Number(campaign.commission_rate),startsAt:campaign.starts_at,endsAt:campaign.ends_at,termsConfirmed:campaign.terms_confirmed,
    disclosureApproved:campaign.disclosure_approved,audienceConsentConfirmed:campaign.audience_consent_confirmed,privacyReviewed:campaign.privacy_reviewed,
  });
}

async function loadCampaign(admin:ReturnType<typeof adminOrThrow>,id:string){
  const{data,error}=await admin.from("partner_campaigns").select("*,partners(name,slug,status,campaigns_locked,disclosure_text)").eq("id",id).single();
  if(error)throw error;
  return data as CampaignRow;
}

function requireReady(campaign:CampaignRow){
  const blockers=launchBlockers(campaign);
  if(blockers.length)throw new Error(`Campaign cannot advance: ${blockers.join("; ")}`);
}

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const admin = adminOrThrow();
    const [partners, campaigns, clicks, attributions, conversions, commissions, payouts, approvals, auditEvents, memberships, readiness] = await Promise.all([
      admin.from("partners").select("*").order("created_at", { ascending: false }),
      admin.from("partner_campaigns").select("*,partners(name)").order("created_at", { ascending: false }),
      admin.from("partner_clicks").select("id,campaign_id,created_at").limit(10000),
      admin.from("partner_attributions").select("id,campaign_id,attributed_at").limit(10000),
      admin.from("partner_conversions").select("id,campaign_id,net_revenue_cents,status,occurred_at").limit(10000),
      admin.from("partner_commissions").select("id,partner_id,campaign_id,amount_cents,status,available_at,created_at").order("created_at", { ascending: false }).limit(1000),
      admin.from("partner_payouts").select("*").order("created_at", { ascending: false }).limit(1000),
      admin.from("partner_campaign_approvals").select("*").order("created_at",{ascending:false}).limit(500),
      admin.from("partner_audit_events").select("*").order("created_at",{ascending:false}).limit(500),
      admin.from("partner_memberships").select("*").order("created_at",{ascending:false}).limit(1000),
      admin.from("partner_readiness_items").select("*").order("created_at",{ascending:true}).limit(2000),
    ]);
    const error = [partners, campaigns, clicks, attributions, conversions, commissions, payouts, approvals, auditEvents, memberships, readiness].find(result => result.error)?.error;
    if (error) throw error;
    const confirmed = (conversions.data || []).filter(row => row.status === "confirmed");
    const commissionRows = commissions.data || [];
    return NextResponse.json({ data: {
      partners: partners.data || [],
      campaigns: campaigns.data || [],
      commissions: commissionRows,
      payouts: payouts.data || [],
      approvals:approvals.data||[],
      auditEvents:auditEvents.data||[],
      memberships:(memberships.data||[]).map(row=>({...safeMembership(row),partnerId:row.partner_id})),
      readiness:readiness.data||[],
      summary: {
        activePartners: (partners.data || []).filter(row => row.status === "active").length,
        activeCampaigns: (campaigns.data || []).filter(row => row.status === "active").length,
        clicks: (clicks.data || []).length,
        attributedCollectors: (attributions.data || []).length,
        paidConversions: confirmed.length,
        netRevenueCents: confirmed.reduce((sum, row) => sum + Number(row.net_revenue_cents || 0), 0),
        pendingCommissionCents: commissionRows.filter(row => row.status === "pending").reduce((sum, row) => sum + Number(row.amount_cents || 0), 0),
        approvedCommissionCents: commissionRows.filter(row => row.status === "approved").reduce((sum, row) => sum + Number(row.amount_cents || 0), 0),
      },
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Partner platform unavailable" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const input = RequestBody.parse(await request.json());
    const admin = adminOrThrow();
    if (input.action === "createPartner") {
      const { data, error } = await admin.from("partners").insert({
        name: input.data.name,
        slug: input.data.slug,
        partner_type: input.data.partnerType,
        website_url: input.data.websiteUrl || null,
        contact_name: input.data.contactName || null,
        contact_email: input.data.contactEmail || null,
        disclosure_text: input.data.disclosureText,
        notes: input.data.notes || null,
      }).select().single();
      if (error) throw error;
      const{error:readinessError}=await admin.from("partner_readiness_items").insert(readinessSeedRows(data.id));
      if(readinessError)throw readinessError;
      await admin.from("partner_audit_events").insert({ partner_id:data.id,action:"partner.created",subject_type:"partner",subject_id:data.id,details:{name:data.name,type:data.partner_type} });
      return NextResponse.json({ data }, { status: 201 });
    }
    if (input.action === "createCampaign") {
      const{data:partner,error:partnerError}=await admin.from("partners").select("id,slug,campaigns_locked,campaign_lock_reason").eq("id",input.data.partnerId).single();
      if(partnerError)throw partnerError;
      if(partner.campaigns_locked)throw new Error(partner.campaign_lock_reason||"Campaign creation and testing are founder-locked for this partner");
      const { data, error } = await admin.from("partner_campaigns").insert({
        partner_id: input.data.partnerId,
        name: input.data.name,
        code: input.data.code,
        channel: input.data.channel,
        destination_path: input.data.destinationPath,
        attribution_window_days: input.data.attributionWindowDays,
        commission_type: input.data.commissionType,
        commission_rate: input.data.commissionRate,
        hold_days: input.data.holdDays,
        starts_at:input.data.startsAt,
        ends_at:input.data.endsAt,
        terms_confirmed:input.data.termsConfirmed,
        disclosure_approved:input.data.disclosureApproved,
        audience_consent_confirmed:input.data.audienceConsentConfirmed,
        privacy_reviewed:input.data.privacyReviewed,
      }).select().single();
      if (error) throw error;
      await admin.from("partner_audit_events").insert({ partner_id:data.partner_id,campaign_id:data.id,action:"campaign.created",subject_type:"campaign",subject_id:data.id,details:{name:data.name,code:data.code,channel:data.channel} });
      return NextResponse.json({ data }, { status: 201 });
    }
    if(input.action==="submitCampaign"){
      const campaign=await loadCampaign(admin,input.id);
      if(!["draft","paused"].includes(campaign.status))throw new Error("Only a draft or paused campaign can be submitted for review");
      requireReady(campaign);
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_campaigns").update({status:"review",approved_at:null,approved_by:null,approval_note:null,approval_fingerprint:null,activated_at:null,updated_at:now}).eq("id",campaign.id).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,action:"campaign.submitted_for_review",subject_type:"campaign",subject_id:campaign.id,details:{code:campaign.code}});
      return NextResponse.json({data});
    }
    if(input.action==="approveCampaign"){
      const campaign=await loadCampaign(admin,input.id);
      if(campaign.status!=="review")throw new Error("Campaign must be in founder review before approval");
      if(input.confirmation!==`APPROVE ${campaign.code}`)throw new Error(`Type APPROVE ${campaign.code} exactly to approve`);
      requireReady(campaign);
      const fingerprint=campaignFingerprint(campaign),now=new Date().toISOString();
      const{data,error}=await admin.from("partner_campaigns").update({status:"approved",approved_at:now,approved_by:"founder",approval_note:input.note,approval_fingerprint:fingerprint,updated_at:now}).eq("id",campaign.id).select().single();
      if(error)throw error;
      await admin.from("partner_campaign_approvals").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,decision:"approved",actor:"founder",note:input.note,configuration_fingerprint:fingerprint});
      await admin.from("partner_audit_events").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,action:"campaign.founder_approved",subject_type:"campaign",subject_id:campaign.id,details:{code:campaign.code,fingerprint}});
      return NextResponse.json({data});
    }
    if(input.action==="launchCampaign"){
      const campaign=await loadCampaign(admin,input.id);
      if(campaign.status!=="approved")throw new Error("Campaign requires a separate founder approval before launch");
      if(input.confirmation!==`LAUNCH ${campaign.code}`)throw new Error(`Type LAUNCH ${campaign.code} exactly to launch`);
      requireReady(campaign);
      const fingerprint=campaignFingerprint(campaign);
      if(!campaign.approval_fingerprint||campaign.approval_fingerprint!==fingerprint)throw new Error("Campaign configuration changed after approval. Return it to founder review.");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_campaigns").update({status:"active",activated_at:now,updated_at:now}).eq("id",campaign.id).select().single();
      if(error)throw error;
      await admin.from("partner_campaign_approvals").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,decision:"launched",actor:"founder",note:"Separate founder launch confirmation recorded.",configuration_fingerprint:fingerprint});
      await admin.from("partner_audit_events").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,action:"campaign.launched",subject_type:"campaign",subject_id:campaign.id,details:{code:campaign.code,fingerprint}});
      return NextResponse.json({data});
    }
    if(input.action==="pauseCampaign"){
      const campaign=await loadCampaign(admin,input.id);
      if(input.confirmation!==`PAUSE ${campaign.code}`)throw new Error(`Type PAUSE ${campaign.code} exactly to pause`);
      if(!["review","approved","active"].includes(campaign.status))throw new Error("This campaign is not running or awaiting launch");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_campaigns").update({status:"paused",updated_at:now}).eq("id",campaign.id).select().single();
      if(error)throw error;
      await admin.from("partner_campaign_approvals").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,decision:"paused",actor:"founder",note:input.emergency?"Emergency founder pause":"Founder pause"});
      await admin.from("partner_audit_events").insert({partner_id:campaign.partner_id,campaign_id:campaign.id,action:input.emergency?"campaign.emergency_paused":"campaign.paused",subject_type:"campaign",subject_id:campaign.id,details:{code:campaign.code}});
      return NextResponse.json({data});
    }
    if(input.action==="emergencyPausePartner"){
      const{data:partner,error}=await admin.from("partners").select("id,slug").eq("id",input.id).single();
      if(error)throw error;
      if(input.confirmation!==`PAUSE ALL ${partner.slug}`)throw new Error(`Type PAUSE ALL ${partner.slug} exactly`);
      const now=new Date().toISOString();
      const{data:campaigns,error:campaignError}=await admin.from("partner_campaigns").update({status:"paused",updated_at:now}).eq("partner_id",partner.id).in("status",["review","approved","active"]).select("id");
      if(campaignError)throw campaignError;
      await admin.from("partners").update({status:"paused",updated_at:now}).eq("id",partner.id);
      await admin.from("partner_audit_events").insert({partner_id:partner.id,action:"partner.emergency_pause",subject_type:"partner",subject_id:partner.id,details:{campaignsPaused:campaigns?.length||0}});
      return NextResponse.json({data:{partnerId:partner.id,campaignsPaused:campaigns?.length||0}});
    }
    if(input.action==="unlockPartnerCampaigns"){
      const{data:partner,error}=await admin.from("partners").select("id,slug,campaigns_locked").eq("id",input.id).single();
      if(error)throw error;
      if(input.confirmation!==`UNLOCK ${partner.slug}`)throw new Error(`Type UNLOCK ${partner.slug} exactly`);
      const now=new Date().toISOString();
      const{data,error:updateError}=await admin.from("partners").update({campaigns_locked:false,campaign_lock_reason:null,updated_at:now}).eq("id",partner.id).select().single();
      if(updateError)throw updateError;
      await admin.from("partner_audit_events").insert({partner_id:partner.id,action:"partner.campaign_lock_removed",subject_type:"partner",subject_id:partner.id,details:{note:input.note}});
      return NextResponse.json({data});
    }
    if(input.action==="inviteMember"){
      const{data:partner,error:partnerError}=await admin.from("partners").select("id,slug,collaboration_locked,collaboration_lock_reason").eq("id",input.data.partnerId).single();
      if(partnerError)throw partnerError;
      if(partner.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"Collaboration is founder-locked for this partner");
      const{token,hash}=createInvitationToken(),expiresAt=invitationExpiresAt(input.data.expiresInDays);
      const{data,error}=await admin.from("partner_memberships").insert({
        partner_id:partner.id,invited_email:input.data.email,display_name:input.data.displayName,role:input.data.role,status:"invited",
        invited_by:"founder",invitation_token_hash:hash,invitation_expires_at:expiresAt,
      }).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partner.id,action:"membership.invited",subject_type:"membership",subject_id:data.id,details:{role:data.role,expiresAt}});
      return NextResponse.json({data:{...safeMembership(data),partnerId:partner.id,invitationPath:`/partners/invite/${token}`}},{status:201});
    }
    if(input.action==="changeMemberRole"){
      const{data:existing,error:lookupError}=await admin.from("partner_memberships").select("id,partner_id").eq("id",input.id).neq("status","revoked").single();
      if(lookupError)throw lookupError;
      const{data:partner}=await admin.from("partners").select("collaboration_locked,collaboration_lock_reason").eq("id",existing.partner_id).single();
      if(partner?.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"Collaboration is founder-locked for this partner");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_memberships").update({role:input.role,updated_at:now}).eq("id",input.id).neq("status","revoked").select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:data.partner_id,action:"membership.role_changed",subject_type:"membership",subject_id:data.id,details:{role:data.role}});
      return NextResponse.json({data:{...safeMembership(data),partnerId:data.partner_id}});
    }
    if(input.action==="revokeMember"){
      const{data:existing,error:lookupError}=await admin.from("partner_memberships").select("id,partner_id").eq("id",input.id).single();
      if(lookupError)throw lookupError;
      const{data:partner}=await admin.from("partners").select("collaboration_locked,collaboration_lock_reason").eq("id",existing.partner_id).single();
      if(partner?.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"Collaboration is founder-locked for this partner");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_memberships").update({status:"revoked",revoked_at:now,invitation_token_hash:null,updated_at:now}).eq("id",input.id).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:data.partner_id,action:"membership.revoked",subject_type:"membership",subject_id:data.id,details:{}});
      return NextResponse.json({data:{...safeMembership(data),partnerId:data.partner_id}});
    }
    if(input.action==="initializeReadiness"){
      const{data:partner,error:partnerError}=await admin.from("partners").select("id,slug,collaboration_locked,collaboration_lock_reason").eq("id",input.partnerId).single();
      if(partnerError)throw partnerError;
      if(partner.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"Readiness initialization is founder-locked for this partner");
      const{data,error}=await admin.from("partner_readiness_items").upsert(readinessSeedRows(partner.id),{onConflict:"partner_id,item_key",ignoreDuplicates:true}).select();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partner.id,action:"partner.readiness_initialized",subject_type:"partner",subject_id:partner.id,details:{itemsCreated:data?.length||0}});
      return NextResponse.json({data:{partnerId:partner.id,itemsCreated:data?.length||0}});
    }
    if(input.action==="reviewReadiness"){
      const{data:partner,error:partnerError}=await admin.from("partners").select("id,collaboration_locked,collaboration_lock_reason").eq("id",input.partnerId).single();
      if(partnerError)throw partnerError;
      if(partner.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"Readiness review is founder-locked for this partner");
      const now=new Date().toISOString();
      const{data,error}=await admin.from("partner_readiness_items").update({status:input.data.status,founder_note:input.data.founderNote,reviewed_by:"founder",reviewed_at:now,updated_at:now}).eq("id",input.data.itemId).eq("partner_id",partner.id).select().single();
      if(error)throw error;
      await admin.from("partner_audit_events").insert({partner_id:partner.id,action:`partner.readiness_${input.data.status}`,subject_type:"readiness",subject_id:data.id,details:{itemKey:data.item_key,founderNote:input.data.founderNote}});
      return NextResponse.json({data});
    }
    if (input.action === "createPayout") {
      if (input.periodStart > input.periodEnd) throw new Error("Payout start date must be before its end date");
      const { data: eligible, error: eligibleError } = await admin.from("partner_commissions")
        .select("id,amount_cents,currency").eq("partner_id", input.partnerId).eq("status", "approved").is("payout_id", null)
        .lte("available_at", `${input.periodEnd}T23:59:59.999Z`);
      if (eligibleError) throw eligibleError;
      if (!eligible?.length) throw new Error("No approved commissions are available for this payout period");
      const currencies = new Set(eligible.map(row=>row.currency));
      if (currencies.size !== 1) throw new Error("A payout statement can contain only one currency");
      const amount = eligible.reduce((sum,row)=>sum+Number(row.amount_cents||0),0);
      const { data:payout,error:payoutError } = await admin.from("partner_payouts").insert({partner_id:input.partnerId,period_start:input.periodStart,period_end:input.periodEnd,amount_cents:amount,currency:eligible[0].currency,status:"approved",payment_reference:input.paymentReference||null}).select().single();
      if (payoutError) throw payoutError;
      const { error:linkError } = await admin.from("partner_commissions").update({payout_id:payout.id,updated_at:new Date().toISOString()}).in("id",eligible.map(row=>row.id));
      if (linkError) throw linkError;
      await admin.from("partner_audit_events").insert({partner_id:input.partnerId,action:"payout.created",subject_type:"payout",subject_id:payout.id,details:{amountCents:amount,commissionCount:eligible.length,periodStart:input.periodStart,periodEnd:input.periodEnd}});
      return NextResponse.json({data:payout},{status:201});
    }
    if (input.action === "markPayoutPaid") {
      const now=new Date().toISOString();
      const {data:payout,error}=await admin.from("partner_payouts").update({status:"paid",payment_reference:input.paymentReference,paid_at:now,updated_at:now}).eq("id",input.id).select().single();
      if(error)throw error;
      await admin.from("partner_commissions").update({status:"paid",updated_at:now}).eq("payout_id",input.id);
      await admin.from("partner_audit_events").insert({partner_id:payout.partner_id,action:"payout.paid",subject_type:"payout",subject_id:payout.id,details:{amountCents:payout.amount_cents,paymentReference:input.paymentReference}});
      return NextResponse.json({data:payout});
    }
    if(input.entity==="partner"&&input.status==="active"){
      const{data:partner,error:partnerError}=await admin.from("partners").select("id,collaboration_locked,collaboration_lock_reason").eq("id",input.id).single();
      if(partnerError)throw partnerError;
      if(partner.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"Partner activation is founder-locked");
      const{data:items,error:itemsError}=await admin.from("partner_readiness_items").select("required,status").eq("partner_id",input.id);
      if(itemsError)throw itemsError;
      const summary=readinessSummary(items||[]);
      if(!summary.complete)throw new Error(`Partner readiness is incomplete: ${summary.approved} of ${summary.required||9} required controls approved`);
    }
    const table = input.entity === "partner" ? "partners" : "partner_commissions";
    const { data, error } = await admin.from(table).update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", input.id).select().single();
    if (error) throw error;
    await admin.from("partner_audit_events").insert({partner_id:input.entity==="partner"?input.id:data.partner_id||null,campaign_id:data.campaign_id||null,action:`${input.entity}.status_changed`,subject_type:input.entity,subject_id:input.id,details:{status:input.status}});
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid partner operation" }, { status: 422 });
  }
}
