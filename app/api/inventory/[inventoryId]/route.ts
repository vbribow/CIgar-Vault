import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeWrite, dataMode } from "@/lib/config";
import { InventoryInputSchema, normalizeInventory } from "@/lib/inventory-model";
import { deleteInventoryRow, updateInventoryRow } from "@/lib/smartsheet";

type Context = { params: Promise<{ inventoryId: string }> };
function failure(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Invalid inventory data", issues: error.issues }, { status: 422 });
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 502 });
}
function guard(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
}

export async function PUT(request: Request, context: Context) {
  const blocked = guard(request); if (blocked) return blocked;
  try {
    const { inventoryId } = await context.params;
    const item = normalizeInventory(InventoryInputSchema.parse(await request.json()));
    if (item.inventoryId !== inventoryId) return NextResponse.json({ error: "Inventory ID cannot be changed" }, { status: 409 });
    await updateInventoryRow(inventoryId, item);
    return NextResponse.json({ data: item });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, context: Context) {
  const blocked = guard(request); if (blocked) return blocked;
  try { const { inventoryId } = await context.params; await deleteInventoryRow(inventoryId); return new NextResponse(null, { status: 204 }); }
  catch (error) { return failure(error); }
}
