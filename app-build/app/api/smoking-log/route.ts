import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { SmokingLogCreateSchema } from "@/lib/records-model";
import { createSmokeId } from "@/lib/smoke-id";
import { findNearDuplicateSmoke } from "@/lib/smoke-journal";
import type { SmokingLog } from "@/lib/types";
import { addSmokingLog, getSmokingLogs, recordSmokingLog } from "@/lib/smartsheet";
import { loadSmokingLogs } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { consumeInventory } from "@/lib/inventory-model";
import { syncCollector25Contribution } from "@/lib/collector-25-contribution";
import { createOwnedRecord, deleteOwnedRecord, loadOwnedRecord, saveOwnedRecord } from "@/lib/user-data";
export async function GET(request: Request) {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    const records = await loadSmokingLogs();
    const submissionId = new URL(request.url).searchParams.get("submissionId");
    if (!submissionId) return NextResponse.json({ data: records });
    const parsedSubmission = SmokingLogCreateSchema.shape.submissionId.safeParse(submissionId);
    if (!parsedSubmission.success) return NextResponse.json({ error: "Invalid submission check" }, { status: 400 });
    return NextResponse.json({ data: records.find(record => record.smokeId === createSmokeId(parsedSubmission.data)) ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const input = SmokingLogCreateSchema.parse(await request.json());
    const { submissionId, newEntryConfirmed, ...fields } = input;
    const item: SmokingLog = { smokeId: createSmokeId(submissionId), ...fields };
    const manual = item.inventoryId === "MANUAL";
    const inventory = manual ? undefined : (await loadInventory()).find(record => record.inventoryId === item.inventoryId);
    if (!manual && !inventory) throw new Error("Inventory lot was not found");
    const priorSmokes = dataMode() === "smartsheet" ? await getSmokingLogs() : await loadSmokingLogs();
    const nearDuplicate = findNearDuplicateSmoke(priorSmokes, item);
    if (nearDuplicate && nearDuplicate.smokeId !== item.smokeId && !newEntryConfirmed) {
      return NextResponse.json({ error: "This matches a smoke already recorded. Choose “Log another” before intentionally recording a separate experience." }, { status: 409 });
    }
    const owned = await createOwnedRecord("smokes",item.smokeId,item);
    if(owned === "exists"){
      const existing = await loadOwnedRecord<SmokingLog>("smokes",item.smokeId);
      if(existing && JSON.stringify(existing) === JSON.stringify(item)) return NextResponse.json({ data: existing, retry: true, collector25: await syncCollector25Contribution(existing, inventory) }, { status: 200 });
      throw new Error("This submission was already used for a different smoking record");
    }
    if(owned === "created"){
      if(inventory){
        try {
          await saveOwnedRecord("inventory",inventory.inventoryId,consumeInventory(inventory,item.quantitySmoked ?? 1));
        } catch (error) {
          await deleteOwnedRecord("smokes",item.smokeId).catch(() => undefined);
          throw error;
        }
      }
      return NextResponse.json({ data: item, collector25: await syncCollector25Contribution(item, inventory) }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    if(manual)await addSmokingLog(item);else await recordSmokingLog(item);
    return NextResponse.json({ data: item, collector25: { status: "ineligible" } }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
