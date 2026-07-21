"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = {
    user_id: user.id,
    display_name: String(formData.get("displayName") || "").trim(),
    collection_name: String(formData.get("collectionName") || "My Cigar Vault").trim(),
    experience_level: String(formData.get("experienceLevel") || "Collector"),
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "user_id" });
  if (error) redirect(`/account?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/account");
  redirect("/account?saved=1");
}
