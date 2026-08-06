"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signOut } from "@/app/login/actions";
import { clearCurrentOwnerDrafts } from "@/lib/device-drafts";

function SignOutButton({ compact }: { compact: boolean }) {
  const { pending } = useFormStatus();
  return <button className={compact ? undefined : "button secondary"} type="submit" disabled={pending} aria-disabled={pending}>
    {compact ? <><strong>{pending ? "Signing out…" : "Sign out"}</strong><small>{pending ? "Ending this session safely" : "End this session; saved account records stay unchanged"}</small></> : pending ? "Signing out…" : "Sign out"}
  </button>;
}

export function DeviceAwareSignOut({ compact = false }: { compact?: boolean }) {
  const [clearDrafts, setClearDrafts] = useState(false);
  return <form action={signOut} className={compact ? "mobileSignOut" : "deviceSignOut"} onSubmit={() => {
    if (!clearDrafts) return;
    try { clearCurrentOwnerDrafts(); } catch { /* Signing out must remain available when storage is blocked. */ }
  }}>
    <label className="check"><input type="checkbox" checked={clearDrafts} onChange={(event) => setClearDrafts(event.target.checked)} /><span>Also clear my unfinished browser-only work from this device</span></label>
    <SignOutButton compact={compact} />
    {!compact && <small>Clearing drafts does not remove saved account records.</small>}
  </form>;
}
