"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const safeNext = (value: FormDataEntryValue | null) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
const failure = (message: string, mode: string, next: string) => `/login?mode=${mode}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`;

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(failure(error.message, "signin", next));
  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const next = "/account";
  const origin = (await headers()).get("origin") || "";
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${origin}/auth/callback?next=${next}` } });
  if (error) redirect(failure(error.message, "signup", next));
  if (!data.session) redirect("/login?mode=signin&notice=Check%20your%20email%20to%20confirm%20your%20account.");
  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();
  const origin = (await headers()).get("origin") || "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) redirect(failure(error.message, "forgot", "/"));
  redirect("/login?mode=signin&notice=Check%20your%20email%20for%20a%20password%20reset%20link.");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");
  if (password.length < 8) redirect("/reset-password?error=Password%20must%20be%20at%20least%208%20characters.");
  if (password !== confirmation) redirect("/reset-password?error=Passwords%20do%20not%20match.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  redirect("/login?notice=Password%20updated.%20You%20can%20sign%20in%20now.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
