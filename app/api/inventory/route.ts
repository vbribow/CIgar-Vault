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
import { accountDataMode, createOwnedRecords } from "@/lib/user-data";
import { applyReusableValuations } from "@/lib/valuation-monitor";

function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: `Check the highlighted inventory details: ${error.issues.map(issue => `${issue.path.join(".") || "record"} — ${issue.message}`).join("; ")}`, issues: error.issues },
      { status: 422 },
    );
  const message = error instanceof Error ? error.message : "Unknown error";
  const status = message.includes("already exists") ? 409 : 502;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const [inventory, mode] = await Promise.all([loadInventory(), accountDataMode()]);
    return NextResponse.json(
      { data: inventory, mode },
      { headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate", Pragma: "no-cache" } },
    );
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
    if([...inventory,...sharedInventory].some(item=>item.inventoryId===draft.inventoryId)){
      return NextResponse.json({error:`${draft.inventoryId} already exists. Open that record to update it, or leave the reference blank so Cedriva can create a new one.`},{status:409});
    }
    const immediate=applyReusableValuations([draft],[...inventory,...sharedInventory],[...valuations,...sharedValuations]);
    const item=immediate.items[0];
    if (await createOwnedRecords([
      {kind:"inventory",recordId:item.inventoryId,payload:item},
      ...immediate.valuations.map(value=>({kind:"valuations" as const,recordId:value.valuationId,payload:value})),
    ])) {
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
