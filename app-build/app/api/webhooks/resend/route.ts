import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resendDeliveryUpdate, validResendWebhookSignature, type ResendDeliveryEvent } from "@/lib/resend-webhook";

export const runtime = "nodejs";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Invitation delivery storage is not configured");
  return createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error:"Resend webhook is not configured" }, { status:503 });
  const payload = await request.text();
  if (!validResendWebhookSignature(payload, {
    id:request.headers.get("svix-id"),
    timestamp:request.headers.get("svix-timestamp"),
    signature:request.headers.get("svix-signature"),
  }, secret)) return NextResponse.json({ error:"Invalid Resend signature" }, { status:401 });
  try {
    const update = resendDeliveryUpdate(JSON.parse(payload) as ResendDeliveryEvent);
    if (!update) return NextResponse.json({ received:true, ignored:true });
    const changes = {
      invitation_delivery_status:update.status,
      invitation_last_checked_at:update.occurredAt,
      invitation_delivered_at:update.status === "delivered" ? update.occurredAt : undefined,
      invitation_failure:update.failure || null,
      ...(update.status === "delivered" ? { stage:"Invited", invited_at:update.occurredAt, last_contact_at:update.occurredAt } : {}),
      updated_at:update.occurredAt,
    };
    const client = admin();
    const { data, error } = await client.from("beta_collectors")
      .update(changes)
      .eq("invitation_provider_id", update.providerId)
      .or(`invitation_last_checked_at.is.null,invitation_last_checked_at.lte.${update.occurredAt}`)
      .select("id");
    if (error) throw error;
    return NextResponse.json({ received:true, matched:data?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "Invitation delivery update failed" }, { status:500 });
  }
}
