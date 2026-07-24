import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeWrite, dataMode } from "@/lib/config";
import { loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import {
  InventoryInputSchema,
  normalizeInventory,
} from "@/lib/inventory-model";
import { addInventoryRow, getInventory, getValuations, recordValuation } from "@/lib/smartsheet";
import { saveOwnedRecord } from "@/lib/user-data";
import { applyReusableValuations } from "@/lib/valuation-monitor";

function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: "Invalid inventory data", issues: error.issues },
      { status: 422 },
    );
  const message = error instanceof Error ? error.message : "Unknown error";
  const status = message.includes("already exists") ? 409 : 502;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json({ data: await loadInventory(), mode: dataMode() }, { headers:{"Cache-Control":"private, no-store, max-age=0"} });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const draft = normalizeInventory(
      InventoryInputSchema.parse(await request.json()),
    );
    const [inventory,valuations,sharedInventory,sharedValuations]=await Promise.all([
      loadInventory(),
      loadValuations().catch(()=>[]),
      getInventory().catch(()=>[]),
      getValuations().catch(()=>[]),
    ]);
    const immediate=applyReusableValuations([draft],[...inventory,...sharedInventory],[...valuations,...sharedValuations]);
    const item=immediate.items[0];
    if (await saveOwnedRecord("inventory", item.inventoryId, item)) {
      await Promise.all(immediate.valuations.map(value=>saveOwnedRecord("valuations",value.valuationId,value)));
      return NextResponse.json({ data:item,valuation:{valuedImmediately:immediate.valuedImmediately,status:immediate.valuedImmediately?"Exact-match value applied":"Priority research queued"} }, { status:201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    await addInventoryRow(item);
    await Promise.all(immediate.valuations.map(recordValuation));
    return NextResponse.json({ data:item,valuation:{valuedImmediately:immediate.valuedImmediately,status:immediate.valuedImmediately?"Exact-match value applied":"Priority research queued"} }, { status:201 });
  } catch (error) {
    return errorResponse(error);
  }
}
