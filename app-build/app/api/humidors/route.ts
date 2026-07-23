import { NextResponse } from "next/server";
import { HumidorSchema } from "@/lib/humidor-model";
import { authorizeWrite, dataMode } from "@/lib/config";
import { getHumidors, saveHumidor } from "@/lib/smartsheet";
import { loadHumidors } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadHumidors() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const parsed = HumidorSchema.parse(await request.json());
    const { memberIds, ...humidor } = parsed;
    if (await saveOwnedRecord("humidors",humidor.humidorId,humidor)) {
      const inventory=await loadInventory();
      await Promise.all(inventory.map(item=>saveOwnedRecord("inventory",item.inventoryId,{...item,storageLocationId:memberIds.includes(item.inventoryId)?humidor.humidorId:item.storageLocationId===humidor.humidorId?undefined:item.storageLocationId})));
      return NextResponse.json({ data: humidor }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await saveHumidor(humidor, memberIds);
    return NextResponse.json({ data: humidor }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
