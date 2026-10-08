import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { assertBetaSeatAvailable } from "@/lib/beta-cohort";
import { betaInvitationEmail } from "@/lib/beta-onboarding";
import { accountEmailConfiguration, getAccountEmailDelivery, submitAccountEmail } from "@/lib/alert-notifications";

const Input = z.object({ collectorId: z.string().uuid(), action:z.enum(["send","status"]).default("send"), submissionId:z.string().uuid().optional() }).superRefine((value,ctx)=>{if(value.action==="send"&&!value.submissionId)ctx.addIssue({code:"custom",path:["submissionId"],message:"A stable invitation submission ID is required."})});

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Beta invitations require Supabase service credentials");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const { collectorId,action,submissionId } = Input.parse(await request.json());
    const client = admin();
    const [{ data: collector, error }, { data: collectors, error: listError }] = await Promise.all([
      client.from("beta_collectors").select("id,name,email,stage,notes,invited_at,last_contact_at,created_at,updated_at,invitation_provider_id,invitation_delivery_status,invitation_submitted_at,invitation_delivered_at,invitation_failure").eq("id", collectorId).maybeSingle(),
      client.from("beta_collectors").select("id,stage"),
    ]);
    if (error || listError) throw error || listError;
    if (!collector) return NextResponse.json({ error: "Beta tester not found" }, { status: 404 });
    const shapeCollector=(row:typeof collector)=>({id:String(row.id),name:String(row.name),email:String(row.email),stage:String(row.stage),notes:row.notes?String(row.notes):undefined,invitedAt:row.invited_at?String(row.invited_at):undefined,lastContactAt:row.last_contact_at?String(row.last_contact_at):undefined,createdAt:String(row.created_at),updatedAt:String(row.updated_at),invitationProviderId:row.invitation_provider_id?String(row.invitation_provider_id):undefined,invitationDeliveryStatus:String(row.invitation_delivery_status||"not_submitted"),invitationSubmittedAt:row.invitation_submitted_at?String(row.invitation_submitted_at):undefined,invitationDeliveredAt:row.invitation_delivered_at?String(row.invitation_delivered_at):undefined,invitationFailure:row.invitation_failure?String(row.invitation_failure):undefined});
    if(action==="status"){
      if(!collector.invitation_provider_id)return NextResponse.json({error:"No tracked system invitation exists for this tester. Use the prepared webmail invitation or submit a new invitation."},{status:409});
      const delivery=await getAccountEmailDelivery(String(collector.invitation_provider_id)),checkedAt=new Date().toISOString(),status=delivery.status==="unknown"?String(collector.invitation_delivery_status||"unknown"):delivery.status,delivered=status==="delivered",failed=status==="failed";
      const changes={invitation_delivery_status:status,invitation_last_checked_at:checkedAt,invitation_delivered_at:delivered?(collector.invitation_delivered_at||checkedAt):collector.invitation_delivered_at,invitation_failure:failed?`Provider reported ${delivery.providerEvent||"failed"}`:collector.invitation_failure,...(delivered&&collector.stage==="Prospect"?{stage:"Invited",invited_at:collector.invited_at||checkedAt,last_contact_at:checkedAt}:{})};
      const{data:updated,error:updateError}=await client.from("beta_collectors").update(changes).eq("id",collector.id).select().single();if(updateError)throw updateError;
      return NextResponse.json({data:{delivered,status,providerEvent:delivery.providerEvent,collector:shapeCollector(updated)}});
    }
    assertBetaSeatAvailable(collectors || [], { ...collector, stage: "Invited" });
    const configuration = accountEmailConfiguration();
    if (!configuration.configured) return NextResponse.json({
      code: "EMAIL_PROVIDER_NOT_CONFIGURED",
      error: "Automated Hojavía email is not configured. Use the prepared webmail invitation instead.",
    }, { status: 503 });
    const email = betaInvitationEmail(collector);
    const submission = await submitAccountEmail(email.recipient, email.subject, email.body, `beta-invitation-${collector.id}-${submissionId!}`);
    if (!submission) throw new Error("Hojavía system email is not configured");
    if(!submission.providerId)throw new Error("The email provider accepted the request without a trackable message ID. Hojavía did not mark the invitation delivered.");
    const submittedAt = new Date().toISOString();
    const delivery=await getAccountEmailDelivery(submission.providerId).catch(()=>({status:"submitted" as const}));
    const delivered=delivery.status==="delivered";
    const { data: updated, error: updateError } = await client.from("beta_collectors").update({ invitation_provider_id:submission.providerId,invitation_delivery_status:delivery.status,invitation_submitted_at:submittedAt,invitation_last_checked_at:submittedAt,invitation_delivered_at:delivered?submittedAt:null,invitation_failure:delivery.status==="failed"?`Provider reported ${delivery.providerEvent||"failed"}`:null,...(delivered?{stage:"Invited",invited_at:collector.invited_at||submittedAt,last_contact_at:submittedAt}:{}),updated_at:submittedAt }).eq("id", collector.id).select().single();
    if (updateError?.code === "23514") throw new Error("The 10-collector founder cohort is full. The invitation was accepted but access was not enabled; contact the tester only after resolving the cohort capacity.");
    if (updateError) throw updateError;
    return NextResponse.json({ data: { submitted:true,delivered,status:delivery.status,recipient:email.recipient,providerId:submission.providerId,collector:shapeCollector(updated) } },{status:delivered?200:202});
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send beta invitation" }, { status: 502 });
  }
}
