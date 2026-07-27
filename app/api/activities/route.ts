import { NextResponse } from "next/server";
import { ActivityInputSchema } from "@/lib/activity-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getActivities, recordActivity } from "@/lib/smartsheet";
import { loadActivities } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { applyActivity } from "@/lib/activity-engine";
import { importOwnedRecords, loadAccountRecords, loadOwnedRecord } from "@/lib/user-data";
import type { InventoryItem } from "@/lib/types";

export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadActivities() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const input = ActivityInputSchema.parse(await request.json());
    const inventory=(await loadInventory()).find(item=>item.inventoryId===input.inventoryId);
    const accountInventory=await loadAccountRecords<InventoryItem>("inventory");
    if(inventory&&accountInventory!==undefined){const applied=applyActivity(inventory,input);const existing=await loadOwnedRecord<ReturnType<typeof applyActivity>["activity"]>("activities",applied.activity.activityId);if(existing)return NextResponse.json({data:existing,inventory,synchronized:true,retry:true});await importOwnedRecords([{kind:"activities",recordId:applied.activity.activityId,payload:applied.activity},{kind:"inventory",recordId:inventory.inventoryId,payload:applied.inventory}]);return NextResponse.json({data:applied.activity,inventory:applied.inventory,synchronized:true},{status:201})}
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    if(inventory){const applied=applyActivity(inventory,input);const existing=(await getActivities()).find(value=>value.activityId===applied.activity.activityId);if(existing)return NextResponse.json({data:existing,retry:true});}
    return NextResponse.json(
      { data: await recordActivity(input) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
