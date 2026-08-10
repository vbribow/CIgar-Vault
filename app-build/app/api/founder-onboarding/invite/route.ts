import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { assertBetaSeatAvailable } from "@/lib/beta-cohort";
import { betaInvitationEmail } from "@/lib/beta-onboarding";
import { accountEmailConfiguration, submitAccountEmail } from "@/lib/alert-notifications";

const Input = z.object({ collectorId: z.string().uuid(), submissionId: z.string().uuid() });

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Beta invitations require Supabase service credentials");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const { collectorId, submissionId } = Input.parse(await request.json());
    const client = admin();
    const [{ data: collector, error }, { data: collectors, error: listError }] = await Promise.all([
      client.from("beta_collectors").select("id,name,email,stage,notes,invited_at,last_contact_at,created_at,updated_at").eq("id", collectorId).maybeSingle(),
      client.from("beta_collectors").select("id,stage"),
    ]);
    if (error || listError) throw error || listError;
    if (!collector) return NextResponse.json({ error: "Beta tester not found" }, { status: 404 });
    assertBetaSeatAvailable(collectors || [], { ...collector, stage: "Invited" });
    const configuration = accountEmailConfiguration();
    if (!configuration.configured) return NextResponse.json({ error: "Hojavía system email is not configured. Add RESEND_API_KEY and HOJAVIA_EMAIL_FROM before sending." }, { status: 503 });
    const email = betaInvitationEmail(collector);
    const submission = await submitAccountEmail(email.recipient, email.subject, email.body, `beta-invitation-${collector.id}-${submissionId}`);
    if (!submission) throw new Error("Hojavía system email is not configured");
    const acceptedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await client.from("beta_collectors").update({ stage: "Invited", invited_at: collector.invited_at || acceptedAt, last_contact_at: acceptedAt, updated_at: acceptedAt }).eq("id", collector.id).select().single();
    if (updateError?.code === "23514") throw new Error("The 10-collector founder cohort is full. The invitation was accepted but access was not enabled; contact the tester only after resolving the cohort capacity.");
    if (updateError) throw updateError;
    return NextResponse.json({ data: { accepted: true, recipient: email.recipient, providerId: submission.providerId, collector: { id:String(updated.id), name:String(updated.name), email:String(updated.email), stage:String(updated.stage), notes:updated.notes ? String(updated.notes) : undefined, invitedAt:updated.invited_at ? String(updated.invited_at) : undefined, lastContactAt:updated.last_contact_at ? String(updated.last_contact_at) : undefined, createdAt:String(updated.created_at), updatedAt:String(updated.updated_at) } } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send beta invitation" }, { status: 502 });
  }
}
