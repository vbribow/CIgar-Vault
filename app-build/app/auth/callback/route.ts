import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { allowedEmailLinkTypes, emailLinkDestination, invalidEmailLinkPath } from "@/lib/auth-email-link";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requested = url.searchParams.get("next") || "/";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(emailLinkDestination(type, next), url.origin));
  }
  const supabase = await createClient();
  if (tokenHash && type && allowedEmailLinkTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(emailLinkDestination(type, next), url.origin));
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return NextResponse.redirect(new URL(emailLinkDestination(type, next), url.origin));
  return NextResponse.redirect(new URL(invalidEmailLinkPath(next), url.origin));
}
