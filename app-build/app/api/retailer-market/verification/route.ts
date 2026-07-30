import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";

const Decision = z.object({
  purchaseSessionId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  note: z.string().trim().min(10).max(2000),
});

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Retailer verification requires private database credentials");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const { data, error } = await admin()
      .from("retailer_purchase_sessions")
      .select("id,inventory_id,retailer_key,retailer_name,listing_url,status,receipt_evidence_url,purchase_date,created_at,updated_at")
      .eq("status", "evidence_pending")
      .order("updated_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load purchase evidence" }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const input = Decision.parse(await request.json());
    const { data, error } = await admin().rpc("review_retailer_purchase", {
      target_session_id: input.purchaseSessionId,
      review_decision: input.decision,
      review_note: input.note,
    });
    if (error) throw error;
    if (!data?.length) throw new Error("Purchase evidence was not updated");
    return NextResponse.json({
      data: { id: data[0].id, status: data[0].status, receiptVerifiedAt: data[0].receipt_verified_at },
      message: input.decision === "verified"
        ? "Transaction verified. Its single owner rating may now contribute to retailer performance."
        : "Evidence rejected. It contributes nothing to retailer ratings.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Purchase verification failed" }, { status: 422 });
  }
}
