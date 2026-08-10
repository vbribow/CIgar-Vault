import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { recordRevision } from "@/lib/record-revision";
import { SmokingLogEditSchema } from "@/lib/records-model";
import { getSmokingLogs, updateSmokingLog } from "@/lib/smartsheet";
import type { SmokingLog } from "@/lib/types";
import { loadOwnedRecord, saveOwnedRecordIfUnchanged } from "@/lib/user-data";
import { syncCollector25Contribution } from "@/lib/collector-25-contribution";
import { loadSmokingLogs } from "@/lib/data";

type Context = { params: Promise<{ smokeId: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    const { smokeId } = await context.params;
    const expectedRevision = request.headers.get("if-match");
    if (!expectedRevision) return NextResponse.json({ error:"Refresh your journal before editing so Hojavía can protect newer changes." }, { status:428 });
    const owned = await loadOwnedRecord<SmokingLog>("smokes", smokeId);
    if (owned) {
      if (recordRevision(owned) !== expectedRevision) return NextResponse.json({ error:"This entry changed on another device. Refresh, review it, and try again." }, { status:409 });
      const corrections = SmokingLogEditSchema.parse(await request.json());
      if (owned.inventoryId !== "MANUAL" && (corrections.outsideInventory !== undefined || corrections.cigarBrand || corrections.cigarLine || corrections.cigarVitola || corrections.cigarName)) {
        return NextResponse.json({ error:"Vault-linked cigar identity cannot be changed from the smoking journal." }, { status:422 });
      }
      const updated: SmokingLog = { smokeId:owned.smokeId, inventoryId:owned.inventoryId, cigarName:owned.cigarName, outsideInventory:owned.outsideInventory, cigarBrand:owned.cigarBrand, cigarLine:owned.cigarLine, cigarVitola:owned.cigarVitola, quantitySmoked:owned.quantitySmoked, ...corrections };
      const result = await saveOwnedRecordIfUnchanged("smokes", smokeId, updated, expectedRevision);
      if (result !== "saved") return NextResponse.json({ error:"This entry changed while saving. Refresh and try again." }, { status:409 });
      const inventory = owned.inventoryId === "MANUAL" ? undefined : (await loadInventory()).find(item => item.inventoryId === owned.inventoryId);
      const scoredForIdentity = inventory
        ? (await loadSmokingLogs()).filter(item=>item.inventoryId===inventory.inventoryId&&Number.isInteger(item.overall)&&(item.overall??0)>=1).sort((a,b)=>b.dateSmoked.localeCompare(a.dateSmoked))[0]
        : undefined;
      return NextResponse.json({ data:updated, collector25:await syncCollector25Contribution(scoredForIdentity??updated, inventory) });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
    if (dataMode() === "mock") return NextResponse.json({ error:"Writes are disabled in mock mode" }, { status:409 });
    const existing = (await getSmokingLogs()).find(item => item.smokeId === smokeId);
    if (!existing) return NextResponse.json({ error:"Smoking entry was not found" }, { status:404 });
    if (recordRevision(existing) !== expectedRevision) return NextResponse.json({ error:"This entry changed. Refresh and try again." }, { status:409 });
    const corrections = SmokingLogEditSchema.parse(await request.json());
    if (existing.inventoryId !== "MANUAL" && (corrections.outsideInventory !== undefined || corrections.cigarBrand || corrections.cigarLine || corrections.cigarVitola || corrections.cigarName)) return NextResponse.json({ error:"Vault-linked cigar identity cannot be changed from the smoking journal." }, { status:422 });
    const updated: SmokingLog = { smokeId:existing.smokeId, inventoryId:existing.inventoryId, cigarName:existing.cigarName, outsideInventory:existing.outsideInventory, cigarBrand:existing.cigarBrand, cigarLine:existing.cigarLine, cigarVitola:existing.cigarVitola, quantitySmoked:existing.quantitySmoked, ...corrections };
    await updateSmokingLog(smokeId, updated);
    return NextResponse.json({ data:updated, collector25:{ status:"ineligible" } });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "Journal correction failed" }, { status:422 });
  }
}
