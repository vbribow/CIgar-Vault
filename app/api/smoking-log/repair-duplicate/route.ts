import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RepairRequest = z.object({
  inventoryId: z.literal("INV-0053"),
  confirmation: z.literal("REMOVE_NEWER_EXACT_DUPLICATE"),
}).strict();

export async function POST(request: Request) {
  try {
    const input = RepairRequest.parse(await request.json());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in before repairing private records" }, { status: 401 });
    const { data, error } = await supabase.rpc("repair_adjacent_duplicate_smoke", { p_inventory_id: input.inventoryId });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Duplicate repair failed" }, { status: 409 });
  }
}
