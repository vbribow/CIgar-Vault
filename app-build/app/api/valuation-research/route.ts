import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { researchInventoryValuation } from "@/lib/valuation-research";
import { automaticValuationResearchIssues } from "@/lib/valuation-monitor";
import { AiCreditError, finishAiCreditUsage, reserveAiCredits } from "@/lib/ai-credits";
import { hasEntitlement } from "@/lib/entitlements";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { z } from "zod";

const Input = z.object({ inventoryId: z.string().min(1).max(120), submissionId: z.string().uuid() });
async function authorization(request: Request) { if (authorizeWrite(request)) return { allowed: true, userId: undefined }; if (!supabaseConfigured()) return { allowed: false, userId: undefined }; const { data: { user } } = await (await createClient()).auth.getUser(); return { allowed: Boolean(user), userId: user?.id }; }
export async function GET(request: Request) { const auth = await authorization(request); if (!auth.allowed) return NextResponse.json({ error: "Sign in before checking valuation research" }, { status: 401 }); return NextResponse.json({ data: { configured: Boolean(process.env.OPENAI_API_KEY?.trim()) } }); }
export async function POST(request: Request) {
  const auth = await authorization(request); if (!auth.allowed) return NextResponse.json({ error: "Sign in before researching values" }, { status: 401 });
  let usageId = "", reserved = false;
  try {
    const input = Input.parse(await request.json()); usageId = input.submissionId;
    const item = (await loadInventory()).find(value => value.inventoryId === input.inventoryId); if (!item) return NextResponse.json({ error: "Inventory lot not found" }, { status: 404 });
    if (auth.userId) { const plan = await loadAccountPlan(); if (!plan || !hasEntitlement(plan, "valuation-research")) return NextResponse.json({ error: "Live valuation research begins with Collector. Your saved records and manual evidence tools remain available.", upgradeUrl: "/pricing?recommended=collector" }, { status: 403 }); await reserveAiCredits(auth.userId, usageId, "valuation-refresh"); reserved = true; }
    const data = await researchInventoryValuation(item), automaticReviewReasons = automaticValuationResearchIssues(data);
    if (reserved) await finishAiCreditUsage(usageId, { status: "completed" });
    return NextResponse.json({ data: { ...data, inventoryId: item.inventoryId, currentQty: item.currentQty, automaticSaveEligible: automaticReviewReasons.length === 0, automaticReviewReasons, lotMarketValue: data.marketValue === null || item.currentQty === undefined ? null : data.marketValue * item.currentQty, lotReplacementValue: data.replacementValue === null || item.currentQty === undefined ? null : data.replacementValue * item.currentQty } });
  } catch (error) { if (reserved && usageId) await finishAiCreditUsage(usageId, { status: "failed" }); return NextResponse.json({ error: error instanceof Error ? error.message : "Valuation research failed" }, { status: error instanceof AiCreditError ? error.status : error instanceof z.ZodError ? 422 : 502 }); }
}
