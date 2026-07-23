import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { ValuationSchema } from "@/lib/records-model";
import { getValuations, recordValuation } from "@/lib/smartsheet";
import { loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: [] });
  try {
    return NextResponse.json({ data: await loadValuations() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const item = ValuationSchema.parse(await request.json());
    if (await saveOwnedRecord("valuations",item.valuationId,item)) {
      if(item.replacementValue!==undefined){const inventory=(await loadInventory()).find(record=>record.inventoryId===item.inventoryId);if(inventory)await saveOwnedRecord("inventory",inventory.inventoryId,{...inventory,retailValue:item.replacementValue});}
      return NextResponse.json({ data: item }, { status: 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    await recordValuation(item);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
