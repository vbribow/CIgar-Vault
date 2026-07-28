import { NextResponse } from "next/server";
import { buildInsurancePdfDocument } from "@/lib/insurance-pdf";
import { buildInsuranceReport } from "@/lib/insurance-report";
import { normalizeInventory } from "@/lib/inventory-model";
import { createClient } from "@/lib/supabase/server";
import type { CigarCollection, InventoryItem, Valuation } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PRIVATE_RECORDS = 5_000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in before downloading your private insurance schedule." }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("vault_records")
      .select("kind,payload")
      .in("kind", ["inventory", "valuations", "collections"])
      .order("record_id")
      .limit(MAX_PRIVATE_RECORDS + 1);
    if (error) throw error;
    if ((data?.length ?? 0) > MAX_PRIVATE_RECORDS) {
      return NextResponse.json({ error: "This Vault is too large for an immediate download. Please contact Hojavía support for a secure prepared export." }, { status: 413 });
    }
    const inventory=(data??[])
      .filter(row=>row.kind==="inventory")
      .map(row=>normalizeInventory(row.payload as InventoryItem));
    const valuations=(data??[])
      .filter(row=>row.kind==="valuations")
      .map(row=>row.payload as Valuation)
      .filter(value=>!value.invalidatedAt);
    const collections=(data??[])
      .filter(row=>row.kind==="collections")
      .map(row=>row.payload as CigarCollection);
    const generatedAt=new Date().toISOString();
    const report=buildInsuranceReport(inventory,[],[],[],new Date(generatedAt),collections);
    const bytes=buildInsurancePdfDocument({
      rows:report.rows,
      valuations,
      generatedAt,
      totals:report.totals,
    });
    const filename=`hojavia-insurance-schedule-${generatedAt.slice(0,10)}.pdf`;
    return new Response(bytes,{
      status:200,
      headers:{
        "Content-Type":"application/pdf",
        "Content-Disposition":`attachment; filename="${filename}"`,
        "Content-Length":String(bytes.byteLength),
        "Cache-Control":"private, no-store, max-age=0",
        "Pragma":"no-cache",
        "X-Content-Type-Options":"nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Hojavía could not prepare the insurance PDF. Your records were not changed. Please try again." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
