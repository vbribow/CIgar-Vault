import { NextResponse } from "next/server";
import { z } from "zod";
import { getInventory } from "@/lib/smartsheet";
import { importOwnedRecords, saveOwnedRecord } from "@/lib/user-data";

const Body = z.object({ inventoryIds: z.array(z.string().trim().min(1)).min(1).max(500) });

export async function POST(request: Request) {
  try {
    const { inventoryIds } = Body.parse(await request.json());
    const selected = new Set(inventoryIds);
    const master = (await getInventory()).filter(item => selected.has(item.inventoryId));
    const missing = inventoryIds.filter(id => !master.some(item => item.inventoryId === id));
    if (missing.length) return NextResponse.json({ error: `Not found in Smartsheet: ${missing.join(", ")}` }, { status: 409 });
    const restored = await importOwnedRecords(master.map(payload => ({ kind: "inventory" as const, recordId: payload.inventoryId, payload })));
    const auditId = `INTEGRITY-${new Date().toISOString()}-${crypto.randomUUID()}`;
    await saveOwnedRecord("integrity", auditId, { auditId, action: "restore-from-smartsheet", inventoryIds, restored, createdAt: new Date().toISOString() });
    return NextResponse.json({ data: { restored, auditId } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose at least one valid inventory record" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Restore failed" }, { status: 502 });
  }
}
