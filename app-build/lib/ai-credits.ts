import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { effectivePlan, plans, type PlanId } from "./entitlements";

export const AI_CREDIT_COSTS = { "cigar-somm": 1, "exact-research": 5, "valuation-refresh": 5, "rating-refresh": 5, "deep-research": 10 } as const;
export type AiCreditFeature = keyof typeof AI_CREDIT_COSTS;
export type AiCreditSummary = { available: boolean; plan: PlanId; allowance: number; used: number; remaining: number };
export class AiCreditError extends Error { constructor(public code: string, message: string, public status = 503) { super(message); } }

function adminClient(): SupabaseClient | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(), key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : undefined;
}
async function accountPlan(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from("profiles").select("billing_plan,billing_status").eq("user_id", userId).maybeSingle();
  if (error) throw new AiCreditError("ledger_unavailable", "Intelligence credit safeguards are temporarily unavailable.");
  return effectivePlan(data?.billing_plan, data?.billing_status);
}
export async function reserveAiCredits(userId: string, usageId: string, feature: AiCreditFeature) {
  const client = adminClient(); if (!client) throw new AiCreditError("ledger_unavailable", "Intelligence credit safeguards are not configured.");
  const plan = await accountPlan(client, userId), credits = AI_CREDIT_COSTS[feature];
  const { data, error } = await client.rpc("reserve_ai_credits", { p_user_id: userId, p_usage_id: usageId, p_feature: feature, p_credits: credits, p_monthly_limit: plans[plan].monthlyAiCredits });
  if (error) throw new AiCreditError("ledger_unavailable", "Intelligence credit safeguards are not ready. No paid research was started.");
  const result = data as { allowed?: boolean; used?: number; remaining?: number };
  if (!result.allowed) throw new AiCreditError("credits_exhausted", `Your ${plans[plan].name} intelligence allowance is used for this month. Cached results remain free, or you can review membership options.`, 429);
  return { plan, credits, used: Number(result.used || 0), remaining: Number(result.remaining || 0) };
}
export async function finishAiCreditUsage(usageId: string, outcome: { status: "completed" | "failed"; inputTokens?: number; outputTokens?: number; providerCostMicrousd?: number }) {
  const client = adminClient(); if (!client) return;
  await client.from("ai_credit_usage").update({ status: outcome.status, input_tokens: outcome.inputTokens || 0, output_tokens: outcome.outputTokens || 0, provider_cost_microusd: outcome.providerCostMicrousd || 0, completed_at: new Date().toISOString() }).eq("usage_id", usageId);
}
export async function loadAiCreditSummary(userId: string): Promise<AiCreditSummary> {
  const client = adminClient(); if (!client) return { available: false, plan: "free", allowance: plans.free.monthlyAiCredits, used: 0, remaining: plans.free.monthlyAiCredits };
  try {
    const plan = await accountPlan(client, userId), start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const { data, error } = await client.from("ai_credit_usage").select("credits").eq("user_id", userId).in("status", ["reserved", "completed"]).gte("created_at", start.toISOString());
    if (error) throw error;
    const used = (data || []).reduce((sum, item) => sum + Number(item.credits || 0), 0), allowance = plans[plan].monthlyAiCredits;
    return { available: true, plan, allowance, used, remaining: Math.max(allowance - used, 0) };
  } catch { return { available: false, plan: "free", allowance: plans.free.monthlyAiCredits, used: 0, remaining: plans.free.monthlyAiCredits }; }
}
