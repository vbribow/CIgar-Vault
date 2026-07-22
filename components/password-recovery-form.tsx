"use client";

import { useState, type FormEvent } from "react";

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
    const response=await fetch("/api/auth/recovery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
    const result=await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error||"Unable to send recovery email.");
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
