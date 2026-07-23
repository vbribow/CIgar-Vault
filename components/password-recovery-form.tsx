"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatRecoveryCountdown, LEGACY_RECOVERY_COOLDOWN_KEY, RECOVERY_COOLDOWN_KEY, RECOVERY_RATE_LIMIT_SECONDS, RECOVERY_SUCCESS_COOLDOWN_SECONDS, recoveryCooldownUntil, recoverySecondsRemaining } from "@/lib/recovery-cooldown";

export function PasswordRecoveryForm() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(RECOVERY_COOLDOWN_KEY) || 0);
    const legacy = Number(window.localStorage.getItem(LEGACY_RECOVERY_COOLDOWN_KEY) || 0);
    window.localStorage.removeItem(LEGACY_RECOVERY_COOLDOWN_KEY);
    const migrated = legacy > Date.now() ? Math.min(legacy, recoveryCooldownUntil(RECOVERY_SUCCESS_COOLDOWN_SECONDS)) : 0;
    const active = saved > Date.now() ? saved : migrated;
    if (active) {
      window.localStorage.setItem(RECOVERY_COOLDOWN_KEY, String(active));
      setCooldownUntil(active);
    } else window.localStorage.removeItem(RECOVERY_COOLDOWN_KEY);
  }, []);

  useEffect(() => {
    if (!cooldownUntil) {
      setSecondsRemaining(0);
      return;
    }
    const update = () => {
      const remaining = recoverySecondsRemaining(cooldownUntil);
      setSecondsRemaining(remaining);
      if (!remaining) {
        window.localStorage.removeItem(RECOVERY_COOLDOWN_KEY);
        setCooldownUntil(0);
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  function startCooldown(seconds: number) {
    const until = recoveryCooldownUntil(seconds);
    window.localStorage.setItem(RECOVERY_COOLDOWN_KEY, String(until));
    setCooldownUntil(until);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (secondsRemaining || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const response=await fetch("/api/auth/recovery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
    const result=await response.json();
    setBusy(false);
    if (!response.ok) {
      if (response.status === 429) startCooldown(Number(result.retryAfterSeconds)||RECOVERY_RATE_LIMIT_SECONDS);
      setError(result.error||"Unable to send recovery email.");
      return;
    }
    startCooldown(Number(result.data?.cooldownSeconds)||RECOVERY_SUCCESS_COOLDOWN_SECONDS);
    setMessage("Recovery email sent. Open only the newest message. Its link will return to the public Cedriva site, not a protected preview.");
  }

  return <form onSubmit={submit}>
    <label><span>Email</span><input name="email" type="email" autoComplete="email" required disabled={busy || secondsRemaining > 0} /></label>
    <button className="button" disabled={busy || secondsRemaining > 0}>{busy ? "Sending…" : secondsRemaining ? `Try again in ${formatRecoveryCountdown(secondsRemaining)}` : "Send reset link"}</button>
    {error && <div className="loginMessage error">{error}</div>}
    {message && <div className="loginMessage">{message}</div>}
    {secondsRemaining > 0 && <div className="recoveryStatus" role="status"><strong>Recovery request paused</strong><span>Do not request another message yet. Check spam or junk and use only the newest email. Successful requests pause for 10 minutes; provider rate limits pause for 65 minutes.</span></div>}
    <p className="recoveryHelp">Still locked out after the timer ends? {supportEmail ? <a href={`mailto:${supportEmail}?subject=Cigar%20Vault%20account%20recovery`}>Contact support</a> : "Contact the Cedriva administrator"} before requesting repeatedly.</p>
  </form>;
}
