import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { SmokingLogSchema } from "@/lib/records-model";
import { getSmokingLogs, recordSmokingLog } from "@/lib/smartsheet";
import { loadSmokingLogs } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { consumeOneInventory } from "@/lib/inventory-model";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadSmokingLogs() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const item = SmokingLogSchema.parse(await request.json());
    if(await saveOwnedRecord("smokes",item.smokeId,item)){
      const inventory=(await loadInventory()).find(record=>record.inventoryId===item.inventoryId);
      if(!inventory)throw new Error("Inventory lot was not found");
      await saveOwnedRecord("inventory",inventory.inventoryId,consumeOneInventory(inventory));
      return NextResponse.json({ data: item }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    await recordSmokingLog(item);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
