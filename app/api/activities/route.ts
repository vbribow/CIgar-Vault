import { NextResponse } from "next/server";
import { ActivityInputSchema } from "@/lib/activity-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getActivities, recordActivity } from "@/lib/smartsheet";
import { loadActivities } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { applyActivity } from "@/lib/activity-engine";
import { saveOwnedRecord } from "@/lib/user-data";

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
    if(inventory){const applied=applyActivity(inventory,input);if(await saveOwnedRecord("activities",applied.activity.activityId,applied.activity)){await saveOwnedRecord("inventory",inventory.inventoryId,applied.inventory);return NextResponse.json({data:applied.activity},{status:201})}}
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
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
