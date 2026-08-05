"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { clearDeviceDrafts, listDeviceDrafts, rememberCurrentDraftOwner, type DeviceDraftSummary } from "@/lib/device-drafts";

export function DeviceDraftManager({ ownerKey }: { ownerKey: string }) {
  const [drafts, setDrafts] = useState<DeviceDraftSummary[]>([]);
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => {
    try { setDrafts(listDeviceDrafts(ownerKey)); }
    catch { setDrafts([]); }
  }, [ownerKey]);

  useEffect(() => {
    try { rememberCurrentDraftOwner(ownerKey); } catch { /* Browser storage can be disabled. */ }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("hojavia:device-drafts-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hojavia:device-drafts-changed", refresh);
    };
  }, [ownerKey, refresh]);

  const clearOne = (draft: DeviceDraftSummary) => {
    if (!window.confirm(`Clear the unfinished ${draft.label.toLowerCase()} from this device? Your saved account records will not change.`)) return;
    try { window.localStorage.removeItem(draft.storageKey); } catch { /* The list refresh remains safe. */ }
    setMessage(`${draft.label} draft cleared from this device.`);
    refresh();
  };
  const clearAll = () => {
    if (!drafts.length || !window.confirm(`Clear all ${drafts.length} unfinished drafts from this device? Your saved account records will not change.`)) return;
    let cleared = 0;
    try { cleared = clearDeviceDrafts(ownerKey); } catch { /* The list refresh remains safe. */ }
    setMessage(`${cleared} device ${cleared === 1 ? "draft" : "drafts"} cleared.`);
    refresh();
  };

  return <section className="deviceDraftManager" aria-labelledby="device-drafts-title">
    <div className="deviceDraftHead"><div><div className="eyebrow">This device</div><h3 id="device-drafts-title">Unfinished work on this browser</h3><p>Drafts stay on this device, are separated by account, and expire automatically after 14 days. Passwords and selected photos are never included.</p></div>{drafts.length > 0 && <button className="textLink destructiveLink" type="button" onClick={clearAll}>Clear all ({drafts.length})</button>}</div>
    {drafts.length === 0 ? <p className="deviceDraftEmpty">No unfinished browser-only work is stored for this account on this device.</p> : <div className="deviceDraftList">{drafts.map((draft) => <article key={draft.storageKey}><div><strong>{draft.label}</strong><small>Updated {new Date(draft.updatedAt).toLocaleString()} · Expires {new Date(draft.expiresAt).toLocaleDateString()}</small></div><div><Link className="button secondary" href={draft.href}>Continue</Link><button className="textLink destructiveLink" type="button" onClick={() => clearOne(draft)}>Clear</button></div></article>)}</div>}
    <small className="deviceDraftNote">These are recovery copies for unfinished forms, not account-synced Vault records. Expired or damaged drafts are removed automatically.</small>
    <output aria-live="polite">{message}</output>
  </section>;
}
