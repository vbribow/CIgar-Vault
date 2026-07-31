import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { betaReinstallEmail, legacyBetaAppOrigin } from "@/lib/beta-onboarding";
import { accountEmailConfiguration, submitAccountEmail } from "@/lib/alert-notifications";

const Input = z.object({ collectorId: z.string().uuid() });

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Beta notifications require Supabase service credentials");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const input = Input.parse(await request.json());
    const client = admin();
    const { data: collector, error } = await client
      .from("beta_collectors")
      .select("id,name,email,stage")
      .eq("id", input.collectorId)
      .maybeSingle();
    if (error) throw error;
    if (!collector) return NextResponse.json({ error: "Beta tester not found" }, { status: 404 });
    if (collector.stage === "Prospect") return NextResponse.json({ error: "Only an invited or active beta tester may receive an operational notice" }, { status: 422 });

    const previousOrigin = process.env.BETA_PREVIOUS_APP_ORIGIN?.trim() || legacyBetaAppOrigin;
    const email = betaReinstallEmail(collector, previousOrigin);
    const configuration = accountEmailConfiguration();
    if (!configuration.configured) {
      return NextResponse.json({ error: "Hojavía system email is not configured. Add RESEND_API_KEY and HOJAVIA_EMAIL_FROM before sending." }, { status: 503 });
    }
    const key = `beta-reinstall-${collector.id}-${email.replacementUrl}`.replace(/[^A-Za-z0-9_.:-]/g, "-").slice(0, 200);
    const submission = await submitAccountEmail(email.recipient, email.subject, email.body, key);
    if (!submission) throw new Error("Hojavía system email is not configured");
    const acceptedAt = new Date().toISOString();
    const { error: updateError } = await client.from("beta_collectors").update({ last_contact_at: acceptedAt, updated_at: acceptedAt }).eq("id", collector.id);
    if (updateError) throw updateError;
    return NextResponse.json({ data: { accepted: true, acceptedAt, providerId: submission.providerId, recipient: email.recipient, subject: email.subject, replacementUrl: email.replacementUrl } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send the beta app update notice" }, { status: 502 });
  }
}
