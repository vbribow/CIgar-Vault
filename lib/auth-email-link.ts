import type { EmailOtpType } from "@supabase/supabase-js";

export const allowedEmailLinkTypes = new Set<EmailOtpType>(["recovery", "signup", "invite", "magiclink", "email_change", "email"]);

export function emailLinkDestination(type: EmailOtpType | null, next: string) {
  return type === "recovery" ? "/reset-password" : next;
}

export function invalidEmailLinkPath(next = "/") {
  const params = new URLSearchParams({
    mode: "signin",
    next,
    link: "invalid",
    error: "This email link has already been used or has expired. If you already confirmed your account, sign in below. Otherwise, send a new confirmation email.",
  });
  return `/login?${params}`;
}
