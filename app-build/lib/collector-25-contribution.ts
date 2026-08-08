import { createClient as createAdmin } from "@supabase/supabase-js";
import { communityCigarKey } from "./community";
import { createClient, supabaseConfigured } from "./supabase/server";
import type { InventoryItem, SmokingLog } from "./types";

export type Collector25ContributionStatus = "contributed" | "disabled" | "ineligible" | "unavailable";

export type Collector25Contribution = {
  brand: string;
  line: string;
  vitola: string;
  vintage?: string | number;
  score: number;
  cigarKey: string;
};

export function collector25ContributionFromSmoke(smoke: SmokingLog, inventory?: InventoryItem): Collector25Contribution | undefined {
  if (!inventory || smoke.inventoryId === "MANUAL" || smoke.inventoryId !== inventory.inventoryId) return undefined;
  if (!Number.isInteger(smoke.overall) || (smoke.overall ?? 0) < 1 || (smoke.overall ?? 0) > 100) return undefined;
  const brand = inventory.brand.trim(), line = inventory.line.trim(), vitola = inventory.vitola.trim();
  if (!brand || !line || !vitola) return undefined;
  const identity = { brand, line, vitola, vintage: inventory.vintage };
  return { ...identity, score: smoke.overall as number, cigarKey: communityCigarKey(identity) };
}

export async function syncCollector25Contribution(smoke: SmokingLog, inventory?: InventoryItem): Promise<{ status: Collector25ContributionStatus }> {
  const contribution = collector25ContributionFromSmoke(smoke, inventory);
  const exactIdentity = inventory && smoke.inventoryId !== "MANUAL" && smoke.inventoryId === inventory.inventoryId
    ? { brand:inventory.brand.trim(), line:inventory.line.trim(), vitola:inventory.vitola.trim(), vintage:inventory.vintage }
    : undefined;
  if (!contribution && !exactIdentity) return { status: "ineligible" };
  if (!supabaseConfigured()) return { status: "unavailable" };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: "unavailable" };
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(), key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) throw new Error("Collector 25 database is not configured");
    const admin = createAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    if (!contribution && exactIdentity) {
      const cigarKey = communityCigarKey(exactIdentity);
      const { error } = await admin.from("community_ratings").delete().eq("user_id",user.id).eq("cigar_key",cigarKey).eq("contribution_source","smoking-journal");
      if (error) throw error;
      return { status:"ineligible" };
    }
    if (!contribution) return { status:"ineligible" };
    const { data: preferences, error: preferenceError } = await supabase.from("account_preferences").select("collector_25_contributions").eq("user_id", user.id).maybeSingle();
    if (preferenceError) throw preferenceError;
    if (preferences?.collector_25_contributions !== true) return { status: "disabled" };
    const { error } = await admin.from("community_ratings").upsert({
      user_id: user.id, display_name: "Anonymous collector", cigar_key: contribution.cigarKey,
      brand: contribution.brand, line: contribution.line, vitola: contribution.vitola,
      vintage: contribution.vintage === undefined ? null : String(contribution.vintage), score: contribution.score,
      review: null, status: "active",
      moderation_reason: "Exact-identity numeric score shared anonymously from a private smoking record. No private notes were shared.",
      contribution_source: "smoking-journal", updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,cigar_key" });
    if (error) throw error;
    return { status: "contributed" };
  } catch {
    return { status: "unavailable" };
  }
}
