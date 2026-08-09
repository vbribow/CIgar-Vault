import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { summarizeFounderApprovals } from "@/lib/founder-approval-inbox";
import { partnerAdmin } from "@/lib/partner-platform";

export async function GET(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const admin = partnerAdmin();
    if (!admin) throw new Error("Founder approval inbox is not configured");
    const [profiles, publications, registryRecords] = await Promise.all([
      admin.from("industry_profiles").select("status").in("status", ["submitted", "approved"]),
      admin.from("industry_publications").select("status").in("status", ["submitted", "approved"]),
      admin.from("industry_registry_records").select("status").in("status", ["submitted", "approved"]),
    ]);
    const error = [profiles, publications, registryRecords].find(result => result.error)?.error;
    if (error) throw error;
    return NextResponse.json({ data: summarizeFounderApprovals({ profiles: profiles.data || [], publications: publications.data || [], registryRecords: registryRecords.data || [] }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Founder approval inbox unavailable" }, { status: 502 });
  }
}
