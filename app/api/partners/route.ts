import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { CampaignInput, PartnerInput } from "@/lib/partner-model";
import { partnerAdmin } from "@/lib/partner-platform";

const RequestBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("createPartner"), data: PartnerInput }),
  z.object({ action: z.literal("createCampaign"), data: CampaignInput }),
  z.object({
    action: z.literal("setStatus"),
    entity: z.enum(["partner", "campaign", "commission"]),
    id: z.string().uuid(),
    status: z.enum(["draft", "active", "paused", "ended", "pending", "approved", "void", "paid"]),
  }),
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

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const admin = adminOrThrow();
    const [partners, campaigns, clicks, attributions, conversions, commissions, payouts] = await Promise.all([
      admin.from("partners").select("*").order("created_at", { ascending: false }),
      admin.from("partner_campaigns").select("*,partners(name)").order("created_at", { ascending: false }),
      admin.from("partner_clicks").select("id,campaign_id,created_at").limit(10000),
      admin.from("partner_attributions").select("id,campaign_id,attributed_at").limit(10000),
      admin.from("partner_conversions").select("id,campaign_id,net_revenue_cents,status,occurred_at").limit(10000),
      admin.from("partner_commissions").select("id,partner_id,campaign_id,amount_cents,status,available_at,created_at").order("created_at", { ascending: false }).limit(1000),
      admin.from("partner_payouts").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    const error = [partners, campaigns, clicks, attributions, conversions, commissions, payouts].find(result => result.error)?.error;
    if (error) throw error;
    const confirmed = (conversions.data || []).filter(row => row.status === "confirmed");
    const commissionRows = commissions.data || [];
    return NextResponse.json({ data: {
      partners: partners.data || [],
      campaigns: campaigns.data || [],
      commissions: commissionRows,
      payouts: payouts.data || [],
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
      await admin.from("partner_audit_events").insert({ partner_id:data.id,action:"partner.created",subject_type:"partner",subject_id:data.id,details:{name:data.name,type:data.partner_type} });
      return NextResponse.json({ data }, { status: 201 });
    }
    if (input.action === "createCampaign") {
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
      }).select().single();
      if (error) throw error;
      await admin.from("partner_audit_events").insert({ partner_id:data.partner_id,campaign_id:data.id,action:"campaign.created",subject_type:"campaign",subject_id:data.id,details:{name:data.name,code:data.code,channel:data.channel} });
      return NextResponse.json({ data }, { status: 201 });
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
    const table = input.entity === "partner" ? "partners" : input.entity === "campaign" ? "partner_campaigns" : "partner_commissions";
    const { data, error } = await admin.from(table).update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", input.id).select().single();
    if (error) throw error;
    await admin.from("partner_audit_events").insert({partner_id:input.entity==="partner"?input.id:data.partner_id||null,campaign_id:input.entity==="campaign"?input.id:data.campaign_id||null,action:`${input.entity}.status_changed`,subject_type:input.entity,subject_id:input.id,details:{status:input.status}});
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid partner operation" }, { status: 422 });
  }
}
