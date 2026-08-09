import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeWrite } from "@/lib/config";
import { BetaCollectorInput, type BetaProgress } from "@/lib/beta-onboarding";
import { assertBetaSeatAvailable, FOUNDER_BETA_SEAT_LIMIT } from "@/lib/beta-cohort";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Founder onboarding requires Supabase service credentials");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const shape = (row: Record<string, unknown>, progress?: BetaProgress) => ({
  id: String(row.id),
  name: String(row.name),
  email: String(row.email),
  stage: String(row.stage),
  notes: row.notes ? String(row.notes) : undefined,
  invitedAt: row.invited_at ? String(row.invited_at) : undefined,
  lastContactAt: row.last_contact_at ? String(row.last_contact_at) : undefined,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  progress,
});

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const client = admin();
    const [queue, auth, records, consents, events] = await Promise.all([
      client.from("beta_collectors").select("*").order("updated_at", { ascending: false }),
      client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      client.from("vault_records").select("user_id,kind,payload").in("kind", ["inventory", "smokes", "integrity"]).limit(10000),
      client.from("account_consents").select("user_id"),
      client.from("product_events").select("user_id,event_type").eq("event_type", "insurance-report-viewed").limit(10000),
    ]);
    if (queue.error || auth.error || records.error || consents.error || events.error) throw queue.error || auth.error || records.error || consents.error || events.error;
    const users = new Map((auth.data.users || []).filter(user => user.email).map(user => [user.email!.toLowerCase(), user]));
    const consented = new Set((consents.data || []).map(row => row.user_id));
    const insurance = new Set((events.data || []).map(row => row.user_id));
    const data = (queue.data || []).map(collector => {
      const user = users.get(String(collector.email).toLowerCase());
      const owned = user ? (records.data || []).filter(row => row.user_id === user.id) : [];
      const progress: BetaProgress = {
        accountCreated: Boolean(user),
        consentRecorded: Boolean(user && consented.has(user.id)),
        inventoryLots: owned.filter(row => row.kind === "inventory").length,
        backupRecorded: owned.some(row => row.kind === "integrity" && (row.payload as { action?: string } | null)?.action === "inventory-backup"),
        smokeLogged: owned.some(row => row.kind === "smokes"),
        insuranceViewed: Boolean(user && insurance.has(user.id)),
      };
      return shape(collector, progress);
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load onboarding queue" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const input = BetaCollectorInput.parse(await request.json());
    const client = admin();
    const { data: collectors, error: readError } = await client.from("beta_collectors").select("id,stage");
    if (readError) throw readError;
    assertBetaSeatAvailable(collectors || [], input);
    const now = new Date().toISOString();
    const { data, error } = await client.from("beta_collectors").insert({
      name: input.name,
      email: input.email.toLowerCase(),
      stage: input.stage,
      notes: input.notes || null,
      invited_at: input.stage === "Invited" ? input.invitedAt || now : input.invitedAt || null,
      last_contact_at: input.lastContactAt || null,
      updated_at: now,
    }).select().single();
    if (error?.code === "23505") throw new Error("That email address is already in the onboarding queue.");
    if (error?.code === "23514") throw new Error(`The ${FOUNDER_BETA_SEAT_LIMIT}-collector founder cohort is full. Keep this collector as a Prospect until a seat is available.`);
    if (error) throw error;
    return NextResponse.json({ data: shape(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid collector" }, { status: 422 });
  }
}

export async function PATCH(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const input = BetaCollectorInput.extend({ id: BetaCollectorInput.shape.id.unwrap() }).parse(await request.json());
    const client = admin();
    const { data: collectors, error: readError } = await client.from("beta_collectors").select("id,stage");
    if (readError) throw readError;
    assertBetaSeatAvailable(collectors || [], input);
    const now = new Date().toISOString();
    const { data, error } = await client.from("beta_collectors").update({
      name: input.name,
      email: input.email.toLowerCase(),
      stage: input.stage,
      notes: input.notes || null,
      invited_at: input.stage === "Invited" && !input.invitedAt ? now : input.invitedAt || null,
      last_contact_at: input.lastContactAt || null,
      updated_at: now,
    }).eq("id", input.id).select().single();
    if (error?.code === "23505") throw new Error("That email address is already in the onboarding queue.");
    if (error?.code === "23514") throw new Error(`The ${FOUNDER_BETA_SEAT_LIMIT}-collector founder cohort is full. Keep this collector as a Prospect until a seat is available.`);
    if (error) throw error;
    return NextResponse.json({ data: shape(data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid collector update" }, { status: 422 });
  }
}
