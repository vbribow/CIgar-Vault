import { NextResponse } from "next/server";
import { z } from "zod";
import { getInventory } from "@/lib/smartsheet";
import type { InventoryItem } from "@/lib/types";
import { buildInventoryRestorePlan } from "@/lib/inventory-integrity";
import { createOwnedRecords, loadAccountRecords } from "@/lib/user-data";

const Body = z.object({ inventoryIds: z.array(z.string().trim().min(1)).min(1).max(500) });

export async function POST(request: Request) {
  try {
    const { inventoryIds } = Body.parse(await request.json());
    const [masterInventory, accountInventory] = await Promise.all([
      getInventory(),
      loadAccountRecords<InventoryItem>("inventory"),
    ]);
    if (!accountInventory) return NextResponse.json({ error: "Sign in before restoring inventory" }, { status: 401 });
    let master: InventoryItem[];
    try {
      master = buildInventoryRestorePlan(
        inventoryIds,
        masterInventory,
        accountInventory,
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Restore conflict" },
        { status: 409 },
      );
    }
    const createdAt = new Date().toISOString();
    const auditId = `INTEGRITY-${createdAt}-${crypto.randomUUID()}`;
    const restored = master.length;
    const created = await createOwnedRecords([
      ...master.map((payload) => ({
        kind: "inventory" as const,
        recordId: payload.inventoryId,
        payload,
      })),
      {
        kind: "integrity" as const,
        recordId: auditId,
        payload: {
          auditId,
          action: "restore-from-smartsheet",
          inventoryIds,
          restored,
          createdAt,
        },
      },
    ]);
    if (!created) {
      return NextResponse.json(
        { error: "Your session ended before recovery could begin. Sign in and try again." },
        { status: 401 },
      );
    }
    return NextResponse.json({ data: { restored, auditId } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose at least one valid inventory record" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Restore failed" }, { status: 502 });
  }
}
