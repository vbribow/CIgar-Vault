import type { SupabaseClient } from "@supabase/supabase-js";
import { effectivePlan } from "./entitlements";

export const RESERVE_TRIAL_DAYS = 21;
export const RESERVE_TRIAL_OFFER = "earned-reserve-21";

export type ReserveTrialSignals = {
  billingPlan?: string | null;
  billingStatus?: string | null;
  redeemedAt?: string | null;
  hasPreviousSubscription?: boolean;
  inventoryLots: number;
  smokeLogs: number;
  valuations: number;
};
export type ReserveTrialEligibility = {
  eligible: boolean;
  inventoryLots: number;
  hasValueMoment: boolean;
  reason: string;
};

export function reserveTrialEligibility(signals: ReserveTrialSignals): ReserveTrialEligibility {
  const base = { inventoryLots: signals.inventoryLots, hasValueMoment: signals.smokeLogs > 0 || signals.valuations > 0 };
  if (effectivePlan(signals.billingPlan, signals.billingStatus) !== "free") return { ...base, eligible: false, reason: "Your current membership already includes premium access." };
  if (signals.redeemedAt || signals.hasPreviousSubscription) return { ...base, eligible: false, reason: "The introductory Reserve trial has already been used on this account." };
  if (signals.inventoryLots < 3) return { ...base, eligible: false, reason: `Document ${3 - signals.inventoryLots} more cigar lot${3 - signals.inventoryLots === 1 ? "" : "s"} to unlock the Reserve trial after Hojavía has something meaningful to protect.` };
  if (!base.hasValueMoment) return { ...base, eligible: false, reason: "Log a smoke or establish a supported valuation to unlock the Reserve trial after your first meaningful collection insight." };
  return { ...base, eligible: true, reason: `Your collection has reached a useful moment. You may experience Reserve for ${RESERVE_TRIAL_DAYS} days before billing begins.` };
}

export async function loadReserveTrialEligibility(client: SupabaseClient, userId: string): Promise<ReserveTrialEligibility> {
  const [profile, records] = await Promise.all([
    client.from("profiles").select("billing_plan,billing_status,reserve_trial_redeemed_at,stripe_subscription_id").eq("user_id", userId).maybeSingle(),
    client.from("vault_records").select("kind").eq("user_id", userId).in("kind", ["inventory", "smokes", "valuations"]).limit(5_000),
  ]);
  if (profile.error || records.error) return { eligible: false, inventoryLots: 0, hasValueMoment: false, reason: "Trial eligibility will appear after the protected membership safeguards are activated." };
  const kinds = records.data || [];
  return reserveTrialEligibility({
    billingPlan: profile.data?.billing_plan,
    billingStatus: profile.data?.billing_status,
    redeemedAt: profile.data?.reserve_trial_redeemed_at,
    hasPreviousSubscription: Boolean(profile.data?.stripe_subscription_id),
    inventoryLots: kinds.filter(row => row.kind === "inventory").length,
    smokeLogs: kinds.filter(row => row.kind === "smokes").length,
    valuations: kinds.filter(row => row.kind === "valuations").length,
  });
}
