"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = {
    user_id: user.id,
    display_name: String(formData.get("displayName") || "").trim(),
    collection_name: String(formData.get("collectionName") || "My Cedriva").trim(),
    experience_level: String(formData.get("experienceLevel") || "Collector"),
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "user_id" });
  if (error) redirect(`/account?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/account");
  redirect("/account?saved=1");
}

export async function recordBetaConsent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const ageConfirmed = formData.get("ageConfirmation") === "on";
  const termsAccepted = formData.get("termsAcceptance") === "on";
  const privacyAccepted = formData.get("privacyAcceptance") === "on";
  if (!ageConfirmed || !termsAccepted || !privacyAccepted) {
    redirect("/account?error=Confirm%20your%20age%20and%20accept%20all%20three%20beta%20notices.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) redirect("/account?error=Consent%20recording%20is%20not%20configured.");
  const acceptedAt = new Date().toISOString();
  const version = "beta-1.0-2026-07-24";
  const admin = createAdminClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.from("account_consents").upsert({
    user_id: user.id,
    age_confirmed_at: acceptedAt,
    terms_version: version,
    terms_accepted_at: acceptedAt,
    privacy_version: version,
    privacy_accepted_at: acceptedAt,
    beta_version: version,
    beta_accepted_at: acceptedAt,
    updated_at: acceptedAt,
  }, { onConflict: "user_id" });
  if (error) redirect(`/account?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/account");
  redirect("/account?saved=consent");
}
