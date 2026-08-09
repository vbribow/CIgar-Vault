"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function filenameFrom(response: Response) {
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  return match?.[1] || `private-collector-record-${new Date().toISOString().slice(0, 10)}.json`;
}

export function CreateRecoveryPoint() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function create() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "The recovery point could not be created.");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The downloaded recovery file was empty.");
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filenameFrom(response);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      const lots = response.headers.get("x-inventory-record-count");
      setMessage(`Recovery point recorded${lots ? ` for ${lots} inventory lot${lots === "1" ? "" : "s"}` : ""}. Your private backup has downloaded.`);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "The recovery point could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="recoveryPointAction" id="recovery-point" aria-busy={busy}>
    <div><strong>Create a recovery point</strong><small id="recovery-point-help">Downloads a complete private JSON backup and records the safeguard in your account. Importing a collection does not create a recovery point.</small></div>
    <ol className="recoverySteps" aria-label="Recovery-point process">
      <li><span>1</span><div><strong>Prepare</strong><small>Hojavía gathers the account-backed Vault records you own.</small></div></li>
      <li><span>2</span><div><strong>Verify</strong><small>The export is checked before it is offered as a download.</small></div></li>
      <li><span>3</span><div><strong>Keep safely</strong><small>Store the JSON file somewhere private and separate from this device.</small></div></li>
    </ol>
    <button className="button" type="button" onClick={create} disabled={busy} aria-describedby="recovery-point-help">{busy ? "Creating and verifying…" : message && !failed ? "Create a fresh recovery point" : "Create recovery point"}</button>
    {message && <output className={failed ? "error" : "success"} role={failed ? "alert" : "status"} aria-atomic="true">{message}</output>}
  </div>;
}
