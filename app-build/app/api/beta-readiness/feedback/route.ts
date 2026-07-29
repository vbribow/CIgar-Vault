import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";

const Update = z.object({
  id: z.string().uuid(),
  status: z.enum(["Open", "Reviewing", "Resolved", "Closed"]),
  founderNote: z.string().trim().max(2000).optional(),
});

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Beta feedback requires Supabase service credentials");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const client = admin();
    const [feedback, auth] = await Promise.all([
      client.from("beta_feedback").select("*").order("created_at", { ascending: false }).limit(200),
      client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (feedback.error || auth.error) throw feedback.error || auth.error;
    const emails = new Map((auth.data.users || []).map(user => [user.id, user.email || "Unknown account"]));
    return NextResponse.json({ data: (feedback.data || []).map(row => ({ ...row, email: emails.get(row.user_id) })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load beta feedback" }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const input = Update.parse(await request.json());
    const { data, error } = await admin().from("beta_feedback").update({
      status: input.status,
      founder_note: input.founderNote || null,
      updated_at: new Date().toISOString(),
    }).eq("id", input.id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid feedback update" }, { status: 422 });
  }
}
