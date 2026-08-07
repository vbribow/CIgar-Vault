"use client";

import { useState, type ChangeEvent } from "react";
import {
  recoveryConfirmationPhrase,
  type RecoveryModeValue,
  type RecoveryOwnerMatch,
  type RecoveryPreview,
} from "@/lib/account-recovery";

type ExportFile = {
  format: string;
  version: number;
  createdAt: string;
  owner: { userId: string; email?: string };
  recordCount: number;
  records: unknown[];
};

type RecoverySource = {
  createdAt: string;
  email?: string;
  recordCount: number;
  ownerMatch: RecoveryOwnerMatch;
};

async function responseJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`The platform received an unreadable recovery response (${response.status}). No records were assumed changed.`);
  }
}

export function VaultRecoveryPanel() {
  const [file, setFile] = useState<ExportFile>();
  const [source, setSource] = useState<RecoverySource>();
  const [preview, setPreview] = useState<RecoveryPreview>();
  const [mode, setMode] = useState<RecoveryModeValue>("missing");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledgeDifferentOwner, setAcknowledgeDifferentOwner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const phrase = recoveryConfirmationPhrase(mode);
  const selectedCount = preview ? mode === "missing" ? preview.missing : mode === "replace" ? preview.missing + preview.conflicts : 0 : 0;
  const differentOwnerBlocked = source?.ownerMatch === "different" && !acknowledgeDifferentOwner;
  const noRecordsSelected = mode !== "skip" && selectedCount === 0;
  const canSubmit = Boolean(preview) && !busy && confirmation === phrase && !differentOwnerBlocked && !noRecordsSelected;

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    setPreview(undefined);
    setSource(undefined);
    setFile(undefined);
    setMode("missing");
    setConfirmation("");
    setAcknowledgeDifferentOwner(false);
    setMessage("");
    const selected = event.target.files?.[0];
    if (!selected) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(await selected.text());
      const response = await fetch("/api/account/recovery/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || "Unable to inspect export");
      setFile(parsed);
      setSource(result.data.source);
      setPreview(result.data.preview);
      setMessage(`Validated ${result.data.preview.total} records from ${new Date(result.data.source.createdAt).toLocaleDateString()}. Nothing has been restored.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid export file. Nothing was restored.");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!file || !preview || !canSubmit) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/recovery/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ export: file, mode, confirmation, acknowledgeDifferentOwner }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || "Recovery failed");
      setMessage(mode === "skip"
        ? `No Vault records changed. Recovery audit ${result.data.auditId} was saved.`
        : `${result.data.restored} records restored. Recovery audit ${result.data.auditId} was saved.`);
      setConfirmation("");
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Recovery failed. No records were assumed changed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="recoveryPanel">
    <div>
      <strong>Restore private Vault records from an account export</strong>
      <small>The file is validated and compared before any recovery action. Profile and preference snapshots remain in the export for reference but are not automatically applied.</small>
    </div>
    <label className="recoveryFile"><span>Choose private-record JSON export</span><input type="file" accept="application/json,.json" onChange={choose} disabled={busy} /></label>
    {preview && source && <>
      <div className={`recoverySource ${source.ownerMatch === "different" ? "recoveryWarning" : ""}`}>
        <strong>{source.ownerMatch === "account" ? "Export matches this account" : source.ownerMatch === "email" ? "Export matches this email" : "Different account identity detected"}</strong>
        <small>{source.email || "No source email recorded"} · Created {new Date(source.createdAt).toLocaleDateString()}</small>
      </div>
      <div className="recoveryMetrics"><span><b>{preview.total}</b>Total</span><span><b>{preview.missing}</b>Missing</span><span><b>{preview.conflicts}</b>Conflicts</span><span><b>{preview.identical}</b>Unchanged</span></div>
      <div className="recoveryKinds">{preview.byKind.map(row => <span key={row.kind}><strong>{row.kind}</strong><small>{row.total} records · {row.missing} missing · {row.conflicts} conflicts</small></span>)}</div>
      <label><span>Recovery behavior</span><select value={mode} onChange={event => { setMode(event.target.value as RecoveryModeValue); setConfirmation(""); }}><option value="missing">Restore missing records only</option><option value="replace">Restore missing records and replace conflicts</option><option value="skip">Save an audit receipt only — change no Vault records</option></select></label>
      <div className={mode === "replace" ? "recoveryWarning" : "recoveryImpact"} role="status">
        <strong>{mode === "missing" ? `${preview.missing} missing record${preview.missing === 1 ? "" : "s"} will be restored` : mode === "replace" ? `${preview.missing} missing and ${preview.conflicts} conflicting record${preview.conflicts === 1 ? "" : "s"} will be written` : "No Vault records will be changed"}</strong>
        <small>{mode === "missing" ? `${preview.conflicts} conflicting record${preview.conflicts === 1 ? " is" : "s are"} preserved as currently saved.` : mode === "replace" ? "Conflicting current records will be replaced by the older export values. This cannot be automatically undone." : "One integrity receipt will be added to document the review."}</small>
      </div>
      {source.ownerMatch === "different" && <label className="recoveryAcknowledgement"><input type="checkbox" checked={acknowledgeDifferentOwner} onChange={event => setAcknowledgeDifferentOwner(event.target.checked)} /><span>I confirm this export belongs to me and I intend to recover it into this account.</span></label>}
      <label><span>Type {phrase} to confirm</span><input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" placeholder={phrase} /></label>
      {noRecordsSelected && <small className="recoveryNoop">There are no records selected by this behavior. Choose the audit-only option if you want to save the review.</small>}
      <button type="button" className="button" onClick={restore} disabled={!canSubmit}>{busy ? "Working…" : mode === "skip" ? "Save recovery audit" : `Restore ${selectedCount} record${selectedCount === 1 ? "" : "s"}`}</button>
    </>}
    {message && <output aria-live="polite">{message}</output>}
  </section>;
}
