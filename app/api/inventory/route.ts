import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeWrite, dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { InventoryInputSchema, normalizeInventory } from "@/lib/inventory-model";
import { addInventoryRow } from "@/lib/smartsheet";

function errorResponse(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Invalid inventory data", issues: error.issues }, { status: 422 });
  const message = error instanceof Error ? error.message : "Unknown error";
  const status = message.includes("already exists") ? 409 : 502;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try { return NextResponse.json({ data: await loadInventory(), mode: dataMode() }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
  try {
    const item = normalizeInventory(InventoryInputSchema.parse(await request.json()));
    await addInventoryRow(item);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
