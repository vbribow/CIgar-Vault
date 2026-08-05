"use client";

import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { clearCurrentOwnerDrafts } from "@/lib/device-drafts";

export function DeviceAwareSignOut({ compact = false }: { compact?: boolean }) {
  const [clearDrafts, setClearDrafts] = useState(false);
  return <form action={signOut} className={compact ? "mobileSignOut" : "deviceSignOut"} onSubmit={() => {
    if (!clearDrafts) return;
    try { clearCurrentOwnerDrafts(); } catch { /* Signing out must remain available when storage is blocked. */ }
  }}>
    <label className="check"><input type="checkbox" checked={clearDrafts} onChange={(event) => setClearDrafts(event.target.checked)} /><span>Also clear my unfinished browser-only work from this device</span></label>
    <button className={compact ? undefined : "button secondary"} type="submit">{compact ? <><strong>Sign out</strong><small>End this session; saved account records stay unchanged</small></> : "Sign out"}</button>
    {!compact && <small>Clearing drafts does not remove saved account records.</small>}
  </form>;
}
