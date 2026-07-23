import { NextResponse } from "next/server";
import type { InventoryItem } from "@/lib/types";
import { getInventory } from "@/lib/smartsheet";
import { loadAccountRecords, saveOwnedRecord } from "@/lib/user-data";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope") === "account" ? "account" : "master";
  try {
    const records = scope === "master" ? await getInventory() : await loadAccountRecords<InventoryItem>("inventory");
    if (!records) return NextResponse.json({ error: "Sign in to back up account inventory" }, { status: 401 });
    const timestamp = new Date().toISOString();
    await saveOwnedRecord("integrity", `BACKUP-${timestamp}-${crypto.randomUUID()}`, { action:"inventory-backup", scope, recordCount:records.length, createdAt:timestamp });
    const payload = JSON.stringify({ format: "cigar-vault-inventory-backup", version: 1, scope, createdAt: timestamp, recordCount: records.length, records }, null, 2);
    return new NextResponse(payload, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="cigar-vault-${scope}-${timestamp.slice(0, 10)}.json"`, "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Backup failed" }, { status: 502 });
  }
}
