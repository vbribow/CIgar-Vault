"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const redirectTo = `${window.location.origin}/auth/confirm?next=/reset-password`;
    const { error: requestError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (requestError) {
      setError(requestError.message === "email rate limit exceeded" ? "Too many recovery emails were requested. Please wait until the hourly email limit resets, then try once more." : requestError.message);
      return;
    }
    setMessage("Recovery email sent. Use the newest message and keep this browser open until you choose your new password.");
  }

  return <form onSubmit={submit}>
    <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
    <button className="button" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
    {error && <div className="loginMessage error">{error}</div>}
    {message && <div className="loginMessage">{message}</div>}
  </form>;
}
