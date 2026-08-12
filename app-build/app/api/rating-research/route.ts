import { NextResponse } from "next/server";
import { loadInventory } from "@/lib/inventory";
import { researchCigarRatings } from "@/lib/cigar-ratings";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { authorizeWrite } from "@/lib/config";
import { AiCreditError, finishAiCreditUsage, reserveAiCredits } from "@/lib/ai-credits";
import { hasEntitlement } from "@/lib/entitlements";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { z } from "zod";

const Input = z.object({ inventoryId: z.string().min(1).max(120), submissionId: z.string().uuid() });
async function authorization(request: Request) { if (authorizeWrite(request)) return { allowed: true, userId: undefined }; if (!supabaseConfigured()) return { allowed: false, userId: undefined }; const { data: { user } } = await (await createClient()).auth.getUser(); return { allowed: Boolean(user), userId: user?.id }; }
export async function POST(request: Request) {
  const auth = await authorization(request); if (!auth.allowed) return NextResponse.json({ error: "Sign in before researching professional ratings" }, { status: 401 });
  let usageId = "", reserved = false;
  try {
    const input = Input.parse(await request.json()); usageId = input.submissionId;
    const item = (await loadInventory()).find(record => record.inventoryId === input.inventoryId); if (!item) return NextResponse.json({ error: "Inventory lot not found" }, { status: 404 });
    if (auth.userId) { const plan = await loadAccountPlan(); if (!plan || !hasEntitlement(plan, "professional-ratings")) return NextResponse.json({ error: "Live professional-rating research is a Reserve capability. Existing ratings and personal tasting records remain available.", upgradeUrl: "/pricing?recommended=reserve" }, { status: 403 }); await reserveAiCredits(auth.userId, usageId, "rating-refresh"); reserved = true; }
    const data = { inventoryId: item.inventoryId, ...await researchCigarRatings(item) }; if (reserved) await finishAiCreditUsage(usageId, { status: "completed" }); return NextResponse.json({ data });
  } catch (error) { if (reserved && usageId) await finishAiCreditUsage(usageId, { status: "failed" }); return NextResponse.json({ error: error instanceof Error ? error.message : "Rating research failed" }, { status: error instanceof AiCreditError ? error.status : error instanceof z.ZodError ? 422 : 502 }); }
}
