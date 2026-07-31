import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { betaReinstallEmail } from "@/lib/beta-onboarding";
import { accountEmailConfiguration, sendAccountEmail } from "@/lib/alert-notifications";

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

    const previousOrigin = process.env.BETA_PREVIOUS_APP_ORIGIN?.trim() || "http://192.168.1.104:3102";
    const replacementOrigin = process.env.BETA_CURRENT_APP_ORIGIN?.trim() || new URL(request.url).origin;
    if (previousOrigin === replacementOrigin) throw new Error("The previous and replacement beta origins must be different");
    const email = betaReinstallEmail(collector, previousOrigin, replacementOrigin);
    const configuration = accountEmailConfiguration();
    if (!configuration.configured) {
      return NextResponse.json({ error: "Hojavía system email is not configured. Add RESEND_API_KEY and HOJAVIA_EMAIL_FROM before sending." }, { status: 503 });
    }
    const key = `beta-reinstall-${collector.id}-${replacementOrigin}`.replace(/[^A-Za-z0-9_.:-]/g, "-").slice(0, 200);
    const sent = await sendAccountEmail(email.recipient, email.subject, email.body, key);
    if (!sent) throw new Error("Hojavía system email did not confirm delivery");
    const sentAt = new Date().toISOString();
    const { error: updateError } = await client.from("beta_collectors").update({ last_contact_at: sentAt, updated_at: sentAt }).eq("id", collector.id);
    if (updateError) throw updateError;
    return NextResponse.json({ data: { sent: true, sentAt, recipient: email.recipient, subject: email.subject, replacementUrl: email.replacementUrl } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send the beta app update notice" }, { status: 502 });
  }
}
