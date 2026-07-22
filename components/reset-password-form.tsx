"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createRecoveryClient } from "@/lib/supabase/recovery-client";

export function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void createRecoveryClient().auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !data.session) setError("This recovery session is unavailable. Request one new reset email and open its link once.");
      else setReady(true);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");
    if (password.length < 8) { setError("Password must be at least 8 characters."); setBusy(false); return; }
    if (password !== confirmation) { setError("Passwords do not match."); setBusy(false); return; }
    const supabase = createRecoveryClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setBusy(false); return; }
    await supabase.auth.signOut();
    window.location.replace("/login?notice=Password%20updated.%20You%20can%20sign%20in%20now.");
  }

  return <form onSubmit={submit}>
    <label><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={8} required disabled={!ready} /></label>
    <label><span>Confirm new password</span><input name="confirmation" type="password" autoComplete="new-password" minLength={8} required disabled={!ready} /></label>
    <button className="button" disabled={!ready || busy}>{busy ? "Updating…" : ready ? "Update password" : "Verifying recovery link…"}</button>
    {error && <div className="loginMessage error">{error}</div>}
  </form>;
}
