import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeWrite } from "@/lib/config";
import { buildBetaReadiness } from "@/lib/beta-readiness";
import { privateBetaEnabled } from "@/lib/beta-access";
import { isFounderAcceptanceTestRecord } from "@/lib/beta-feedback";

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return NextResponse.json({ data: buildBetaReadiness({
      inviteOnly: privateBetaEnabled(),
      serviceCredentials: false,
      migrationsReady: false,
      invited: 0,
      signedUp: 0,
      consented: 0,
      backedUp: 0,
      openFeedback: 0,
      blockingFeedback: 0,
    }) });
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [auth, collectors, consents, feedback, audits] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("beta_collectors").select("email,stage"),
    admin.from("account_consents").select("user_id"),
    admin.from("beta_feedback").select("status,severity,summary,page_url"),
    admin.from("vault_records").select("user_id,payload").eq("kind", "integrity").limit(10000),
  ]);
  const serviceCredentials = !auth.error && !collectors.error && !audits.error;
  const migrationsReady = !consents.error && !feedback.error;
  const users = auth.data?.users || [];
  const invitedRows = (collectors.data || []).filter(row => row.stage !== "Prospect");
  const invitedEmails = new Set(invitedRows.map(row => String(row.email).toLowerCase()));
  const signedUpUsers = users.filter(user => user.email && invitedEmails.has(user.email.toLowerCase()));
  const signedUpIds = new Set(signedUpUsers.map(user => user.id));
  const consented = new Set((consents.data || []).filter(row => signedUpIds.has(row.user_id)).map(row => row.user_id)).size;
  const backedUp = new Set((audits.data || []).filter(row => {
    const payload = row.payload as { action?: string } | null;
    return signedUpIds.has(row.user_id) && payload?.action === "inventory-backup";
  }).map(row => row.user_id)).size;
  const readinessFeedback = (feedback.data || []).filter(row => !isFounderAcceptanceTestRecord(row));
  const openRows = readinessFeedback.filter(row => row.status === "Open" || row.status === "Reviewing");
  return NextResponse.json({ data: buildBetaReadiness({
    inviteOnly: privateBetaEnabled(),
    serviceCredentials,
    migrationsReady,
    invited: invitedRows.length,
    signedUp: signedUpUsers.length,
    consented,
    backedUp,
    openFeedback: openRows.length,
    blockingFeedback: openRows.filter(row => row.severity === "Blocking").length,
  }) });
}
