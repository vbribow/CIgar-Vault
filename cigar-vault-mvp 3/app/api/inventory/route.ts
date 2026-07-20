import { NextResponse } from "next/server";
import { z } from "zod";
import { loadInventory } from "@/lib/inventory";
import { addInventoryRow } from "@/lib/smartsheet";

const InventoryInput = z.object({
  inventoryId: z.string().min(1), catalogId: z.string().optional(), brand: z.string().min(1), line: z.string().default(""),
  vitola: z.string().min(1), vintage: z.union([z.string(), z.number()]).optional(), originalQty: z.number().nonnegative().optional(),
  smokedQty: z.number().nonnegative().optional(), status: z.string().optional(), priority: z.string().optional(), score: z.number().min(0).max(100).optional(), action: z.string().optional(),
});

export async function GET() {
  try { return NextResponse.json({ data: await loadInventory() }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    if (process.env.USE_MOCK_DATA === "true") return NextResponse.json({ error: "Writes are disabled in mock mode" }, { status: 409 });
    const item = InventoryInput.parse(await request.json());
    await addInventoryRow(item);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
