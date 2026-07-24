import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { buildAccountExport } from "@/lib/account-security";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Account service is not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to export your vault" }, { status: 401 });
  try {
    const [{ data: profile, error: profileError }, { data: preferences, error: preferencesError }, { data: records, error: recordsError }] = await Promise.all([
      supabase.from("profiles").select("display_name,collection_name,experience_level,billing_plan,billing_status,created_at,updated_at").eq("user_id", user.id).maybeSingle(),
      supabase.from("account_preferences").select("email_notifications,wishlist_alerts,valuation_research,rating_research,product_analytics,upgrade_recommendations,updated_at").eq("user_id", user.id).maybeSingle(),
      supabase.from("vault_records").select("kind,record_id,payload,updated_at").eq("user_id",user.id).order("kind").order("record_id"),
    ]);
    if (profileError || preferencesError || recordsError) throw profileError || preferencesError || recordsError;
    const createdAt = new Date().toISOString();
    const payload = buildAccountExport({ userId:user.id, email:user.email, profile, preferences, records:records || [], createdAt });
    return new NextResponse(JSON.stringify(payload, null, 2), { headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="cedriva-private-record-${createdAt.slice(0,10)}.json"`,
      "cache-control": "no-store",
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vault export failed" }, { status: 502 });
  }
}
