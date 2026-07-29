import { createClient } from "@supabase/supabase-js";

export function privateBetaEnabled(
  value = process.env.BETA_INVITE_ONLY,
  environment = process.env.NODE_ENV,
) {
  if (value?.trim()) return value.trim().toLowerCase() === "true";
  return environment === "production";
}

export function normalizeBetaEmail(email: string) {
  return email.trim().normalize("NFKC").toLowerCase();
}

export async function requireBetaInvitation(email: string) {
  if (!privateBetaEnabled()) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Private beta enrollment is temporarily unavailable.");
  }
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("beta_collectors")
    .select("id,stage")
    .eq("email", normalizeBetaEmail(email))
    .maybeSingle();
  if (error) throw new Error("Private beta enrollment is temporarily unavailable.");
  if (!data || data.stage === "Prospect") {
    throw new Error("This private beta is invitation-only. Use the email address Brian invited.");
  }
}
