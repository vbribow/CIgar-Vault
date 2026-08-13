import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { commissionAmountCents } from "@/lib/partner-model";

export const referralCookieName = "hojavia_partner_referral";

export function partnerAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return undefined;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function claimPartnerReferral(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(referralCookieName)?.value;
  const admin = partnerAdmin();
  if (!token || !admin) return;
  const { data: click } = await admin
    .from("partner_clicks")
    .select("id,partner_id,campaign_id,created_at,partner_campaigns(attribution_window_days)")
    .eq("click_token", token)
    .maybeSingle();
  if (!click) return;
  const relation = click.partner_campaigns as unknown as { attribution_window_days?: number } | null;
  const days = relation?.attribution_window_days || 30;
  const attributedAt = new Date();
  const expiresAt = new Date(attributedAt.getTime() + days * 86_400_000);
  await admin.from("partner_attributions").upsert({
    user_id: userId,
    click_id: click.id,
    partner_id: click.partner_id,
    campaign_id: click.campaign_id,
    attributed_at: attributedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  }, { onConflict: "user_id" });
}

export async function recordPaidPartnerConversion(input: {
  userId: string;
  externalEventId: string;
  kind: "subscription_started" | "invoice_paid";
  grossRevenueCents: number;
  netRevenueCents: number;
  currency?: string;
  occurredAt?: string;
}) {
  const admin = partnerAdmin();
  if (!admin) return { attributed: false };
  const { data: attribution } = await admin
    .from("partner_attributions")
    .select("id,partner_id,campaign_id,expires_at,partner_campaigns(commission_type,commission_rate,hold_days)")
    .eq("user_id", input.userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!attribution) return { attributed: false };
  const rule = attribution.partner_campaigns as unknown as {
    commission_type: "percentage" | "fixed";
    commission_rate: number;
    hold_days: number;
  };
  const { data: conversion, error } = await admin.from("partner_conversions").upsert({
    attribution_id: attribution.id,
    user_id: input.userId,
    partner_id: attribution.partner_id,
    campaign_id: attribution.campaign_id,
    conversion_kind: input.kind,
    external_event_id: input.externalEventId,
    gross_revenue_cents: input.grossRevenueCents,
    net_revenue_cents: input.netRevenueCents,
    currency: input.currency || "usd",
    status: "confirmed",
    occurred_at: input.occurredAt || new Date().toISOString(),
  }, { onConflict: "external_event_id" }).select("id").single();
  if (error || !conversion) {
    if (error?.code === "23505") return { attributed: true, duplicate: true };
    throw error;
  }
  const amount = commissionAmountCents(input.netRevenueCents, rule.commission_type, Number(rule.commission_rate));
  const availableAt = new Date(Date.now() + Number(rule.hold_days || 0) * 86_400_000);
  await admin.from("partner_commissions").upsert({
    conversion_id: conversion.id,
    partner_id: attribution.partner_id,
    campaign_id: attribution.campaign_id,
    amount_cents: amount,
    currency: input.currency || "usd",
    commission_type: rule.commission_type,
    commission_rate: rule.commission_rate,
    status: "pending",
    available_at: availableAt.toISOString(),
  }, { onConflict: "conversion_id" });
  return { attributed: true, commissionCents: amount };
}

export async function reversePartnerConversion(externalEventId: string) {
  const admin = partnerAdmin();
  if (!admin) return { reversed: false };
  const { data: conversion } = await admin.from("partner_conversions").select("id").eq("external_event_id", externalEventId).maybeSingle();
  if (!conversion) return { reversed: false };
  await Promise.all([
    admin.from("partner_conversions").update({ status: "refunded" }).eq("id", conversion.id),
    admin.from("partner_commissions").update({ status: "void", updated_at: new Date().toISOString() }).eq("conversion_id", conversion.id).neq("status", "paid"),
  ]);
  return { reversed: true };
}
