import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ data: { ownerKey: "local-preview" } }, { headers: { "cache-control": "no-store" } });
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in before restoring device drafts" }, { status: 401, headers: { "cache-control": "no-store" } });
  return NextResponse.json({ data: { ownerKey: user.id } }, { headers: { "cache-control": "no-store" } });
}
