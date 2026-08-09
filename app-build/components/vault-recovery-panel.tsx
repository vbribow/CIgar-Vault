"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ExportFile>();
  const [source, setSource] = useState<RecoverySource>();
  const [preview, setPreview] = useState<RecoveryPreview>();
  const [mode, setMode] = useState<RecoveryModeValue>("missing");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledgeDifferentOwner, setAcknowledgeDifferentOwner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [selectedName, setSelectedName] = useState("");

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
    setFailed(false);
    const selected = event.target.files?.[0];
    if (!selected) return;
    setSelectedName(selected.name);
    setBusy(true);
    setMessage(`Checking ${selected.name} against this account. Nothing is being restored yet.`);
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
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Invalid export file. Nothing was restored.");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!file || !preview || !canSubmit) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
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
      setFile(undefined);
      setSource(undefined);
      setPreview(undefined);
      setSelectedName("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (error) {
      setFailed(true);
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
    <ol className="recoverySteps" aria-label="Vault recovery process">
      <li className={!preview ? "active" : "complete"}><span>1</span><div><strong>Choose and inspect</strong><small>No records change while the file is checked.</small></div></li>
      <li className={preview ? "active" : ""}><span>2</span><div><strong>Compare impact</strong><small>Review missing, conflicting, and unchanged records.</small></div></li>
      <li><span>3</span><div><strong>Confirm intentionally</strong><small>Only the behavior you select can be applied.</small></div></li>
    </ol>
    <label className="recoveryFile" id="recovery-file-label"><span>Choose private-record JSON export</span><input ref={fileInput} type="file" accept="application/json,.json" onChange={choose} disabled={busy} aria-describedby="recovery-file-guidance" /><small id="recovery-file-guidance">The file stays private to this recovery request. Selecting it does not restore anything.</small></label>
    {selectedName && <p className="recoverySelectedFile" role="status"><strong>Selected file</strong><span>{selectedName}</span></p>}
    {preview && source && <>
      <div className={`recoverySource ${source.ownerMatch === "different" ? "recoveryWarning" : ""}`}>
        <strong>{source.ownerMatch === "account" ? "Export matches this account" : source.ownerMatch === "email" ? "Export matches this email" : "Different account identity detected"}</strong>
        <small>{source.email || "No source email recorded"} · Created {new Date(source.createdAt).toLocaleDateString()}</small>
      </div>
      <div className="recoveryMetrics"><span><b>{preview.total}</b>Total</span><span><b>{preview.missing}</b>Missing</span><span><b>{preview.conflicts}</b>Conflicts</span><span><b>{preview.identical}</b>Unchanged</span></div>
      <div className="recoveryKinds">{preview.byKind.map(row => <span key={row.kind}><strong>{row.kind}</strong><small>{row.total} records · {row.missing} missing · {row.conflicts} conflicts</small></span>)}</div>
      <label><span>Recovery behavior</span><select value={mode} onChange={event => { setMode(event.target.value as RecoveryModeValue); setConfirmation(""); }}><option value="missing">Restore missing records only</option><option value="replace">Restore missing records and replace conflicts</option><option value="skip">Save an audit receipt only — change no Vault records</option></select></label>
      <div id="recovery-impact" className={mode === "replace" ? "recoveryWarning" : "recoveryImpact"} role="status" aria-live="polite">
        <strong>{mode === "missing" ? `${preview.missing} missing record${preview.missing === 1 ? "" : "s"} will be restored` : mode === "replace" ? `${preview.missing} missing and ${preview.conflicts} conflicting record${preview.conflicts === 1 ? "" : "s"} will be written` : "No Vault records will be changed"}</strong>
        <small>{mode === "missing" ? `${preview.conflicts} conflicting record${preview.conflicts === 1 ? " is" : "s are"} preserved as currently saved.` : mode === "replace" ? "Conflicting current records will be replaced by the older export values. This cannot be automatically undone." : "One integrity receipt will be added to document the review."}</small>
      </div>
      {source.ownerMatch === "different" && <label className="recoveryAcknowledgement"><input type="checkbox" checked={acknowledgeDifferentOwner} onChange={event => setAcknowledgeDifferentOwner(event.target.checked)} /><span>I confirm this export belongs to me and I intend to recover it into this account.</span></label>}
      <label><span>Type {phrase} to confirm</span><input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" placeholder={phrase} /></label>
      {noRecordsSelected && <small className="recoveryNoop">There are no records selected by this behavior. Choose the audit-only option if you want to save the review.</small>}
      <button type="button" className="button" onClick={restore} disabled={!canSubmit} aria-describedby="recovery-impact">{busy ? "Applying the confirmed recovery…" : mode === "skip" ? "Save recovery audit" : `Restore ${selectedCount} record${selectedCount === 1 ? "" : "s"}`}</button>
    </>}
    {message && <output className={failed ? "error" : "success"} role={failed ? "alert" : "status"} aria-live={failed ? "assertive" : "polite"} aria-atomic="true">{message}</output>}
  </section>;
}
