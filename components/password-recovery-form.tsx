"use client";

import { useState, type FormEvent } from "react";
import { createRecoveryClient } from "@/lib/supabase/recovery-client";
import { appOrigin } from "@/lib/app-origin";

export function PasswordRecoveryForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const productionHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const origin = appOrigin(window.location.origin, productionHost);
    const redirectTo = `${origin}/reset-password`;
    const { error: requestError } = await createRecoveryClient().auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (requestError) {
      setError(requestError.message === "email rate limit exceeded" ? "Too many recovery emails were requested. Please wait until the hourly email limit resets, then try once more." : requestError.message);
      return;
    }
    setMessage("Recovery email sent. Open only the newest message. Its link will return to the public Cigar Vault site, not a protected preview.");
  }

  return <form onSubmit={submit}>
    <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
    <button className="button" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
    {error && <div className="loginMessage error">{error}</div>}
    {message && <div className="loginMessage">{message}</div>}
  </form>;
}
