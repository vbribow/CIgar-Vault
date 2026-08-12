import { NextResponse } from "next/server";
import { CigarSommQuestionSchema, askCigarSomm } from "@/lib/cigar-somm";
import { buildCigarSommCollectorContext } from "@/lib/cigar-somm-context";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadHumidorReadings, loadHumidors, loadSmokingLogs, loadValuations, loadWishlist } from "@/lib/data";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { authorizeWrite } from "@/lib/config";
import { AiCreditError, finishAiCreditUsage, reserveAiCredits } from "@/lib/ai-credits";

async function authorization(request: Request) {
  if (supabaseConfigured()) { const { data: { user } } = await (await createClient()).auth.getUser(); if (user) return { allowed: true, userId: user.id }; }
  return { allowed: authorizeWrite(request), userId: undefined };
}
export async function POST(request: Request) {
  const auth = await authorization(request);
  if (!auth.allowed) return NextResponse.json({ error: "Sign in to ask Cigar Somm" }, { status: 401 });
  let usageId = "", reserved = false;
  try {
    const input = CigarSommQuestionSchema.parse(await request.json()); usageId = input.submissionId;
    if (auth.userId) { await reserveAiCredits(auth.userId, usageId, "cigar-somm"); reserved = true; }
    const [inventory, smokes, valuations, wishlist, collections, humidors, readings] = await Promise.all([loadInventory(), loadSmokingLogs(), loadValuations(), loadWishlist(), loadCollections(), loadHumidors(), loadHumidorReadings()]);
    const context = buildCigarSommCollectorContext({ inventory, smokes, valuations, wishlist, collections, humidors, readings, selectedInventoryId: input.inventoryId });
    const data = await askCigarSomm(input, inventory, smokes, context);
    if (reserved) await finishAiCreditUsage(usageId, { status: "completed" });
    return NextResponse.json({ data });
  } catch (error) {
    if (reserved && usageId) await finishAiCreditUsage(usageId, { status: "failed" });
    const message = error instanceof Error ? error.message : "Cigar Somm could not answer";
    const status = error instanceof AiCreditError ? error.status : message.includes("configured") ? 503 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
