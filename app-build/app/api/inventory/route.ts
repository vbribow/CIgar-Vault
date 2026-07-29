import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
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
import { createServerRecordId } from "@/lib/server-record-id";

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
    const body=await request.json();
    if(typeof body!=="object"||body===null||Array.isArray(body))throw new Error("Invalid inventory entry");
    if("inventoryId" in body)return NextResponse.json({error:"Hojavía creates inventory references automatically. Open an existing record to edit it."},{status:409});
    const submissionId=z.string().uuid().optional().parse(body.submissionId);
    const {submissionId:_submissionId,...fields}=body;
    const draft = normalizeInventory(InventoryInputSchema.parse({...fields,inventoryId:createServerRecordId("inventory",submissionId)}));
    const [inventory,valuations,sharedInventory,sharedValuations]=await Promise.all([
      loadInventory(),
      loadValuations().catch(()=>[]),
      getInventory().catch(()=>[]),
      getValuations().catch(()=>[]),
    ]);
    const duplicate=[...inventory,...sharedInventory].find(item=>item.inventoryId===draft.inventoryId);
    if(duplicate){
      const unchanged=Object.entries(fields).every(([key,value])=>JSON.stringify(duplicate[key as keyof typeof duplicate])===JSON.stringify(value));
      if(unchanged)return NextResponse.json({data:duplicate,retry:true},{status:200});
      return NextResponse.json({error:"This submission was already used for a different inventory entry."},{status:409});
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
