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
    <div><strong>Create a recovery point</strong><small>Downloads a complete private JSON backup and records the safeguard in your account. Importing a collection does not create a recovery point.</small></div>
    <button className="button" type="button" onClick={create} disabled={busy}>{busy ? "Creating and verifying…" : "Create recovery point"}</button>
    {message && <output className={failed ? "error" : "success"} role={failed ? "alert" : "status"} aria-atomic="true">{message}</output>}
  </div>;
}
