"use client";

import { useState, type FormEvent } from "react";
import type { InventoryItem } from "@/lib/types";

type Row = { row: number; item?: InventoryItem; errors: string[]; warnings: string[]; duplicate: boolean };
type Preview = { fileName: string; rows: Row[]; valid: number; invalid: number; duplicates: number; columns: string[] };

async function responseJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`The platform received an unreadable import response (${response.status}). Nothing was assumed saved.`);
  }
}

export function InventoryFileImport() {
  const [preview, setPreview] = useState<Preview>();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState("");

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/import-inventory", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || "Preview failed");
      setPreview(result.data);
      setSelected(new Set(result.data.rows.filter((row: Row) => row.item && !row.duplicate).map((row: Row) => row.row)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed. Nothing was imported.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    setMessage("");
    try {
      const selectedRows = preview.rows.filter(row => row.item && selected.has(row.row));
      const items = selectedRows.map(row => row.item);
      const acknowledgedDuplicateIds = selectedRows.filter(row => row.duplicate).map(row => row.item!.inventoryId);
      const response = await fetch("/api/account/import-inventory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "commit", fileName: preview.fileName, items, acknowledgedDuplicateIds }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || "Import failed");
      setBatch(result.data.batchId);
      setMessage(`${result.data.imported} inventory lots imported safely. ${result.data.valuationStatus}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed. Refresh the preview before retrying.");
    } finally {
      setBusy(false);
    }
  }

  async function rollback() {
    if (!batch) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/import-inventory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "rollback", batchId: batch }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || "Rollback failed");
      setMessage(`${result.data.removed} unchanged imported lots removed.${result.data.protected ? ` ${result.data.protected} later-edited record(s) were preserved and remain in your Vault.` : ""}`);
      setBatch("");
      setPreview(undefined);
      setSelected(new Set());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rollback failed. No records were assumed removed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="card inventoryFileImport">
    <div><div className="eyebrow">Secure inventory migration</div><h2>Import Excel or CSV</h2><p>Upload one `.xlsx` worksheet or CSV. The platform rejects macros, formulas, links, embedded objects, and unsupported files. Nothing is saved until you review and confirm.</p></div>
    <form onSubmit={inspect} aria-busy={busy}><input name="file" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required disabled={busy||Boolean(batch)}/><button className="button" disabled={busy||Boolean(batch)}>{busy ? "Inspecting…" : batch ? "Import completed" : "Preview inventory"}</button></form>
    {batch&&<button type="button" className="button secondary" onClick={()=>{setBatch("");setPreview(undefined);setSelected(new Set());setMessage("")}}>Import another file</button>}
    {message && <output aria-live="polite">{message}</output>}
    {preview && <div className="importPreview">
      <p><strong>{preview.valid} valid</strong> · {preview.invalid} need correction · {preview.duplicates} possible duplicates</p>
      <div className="tableWrap"><table className="table"><thead><tr><th>Use</th><th>Row</th><th>Cigar</th><th>Quantity</th><th>Review</th></tr></thead><tbody>{preview.rows.slice(0, 200).map(row => <tr key={row.row}><td><input type="checkbox" disabled={!row.item || busy || Boolean(batch)} checked={selected.has(row.row)} onChange={event => setSelected(current => { const next = new Set(current); event.target.checked ? next.add(row.row) : next.delete(row.row); return next; })}/></td><td>{row.row}</td><td>{row.item ? <><strong>{row.item.brand}</strong><small>{row.item.line} · {row.item.vitola}</small></> : "Invalid row"}</td><td>{row.item?.currentQty ?? "—"}</td><td>{[...row.errors, ...row.warnings].join("; ") || "Ready"}{row.duplicate && selected.has(row.row) ? " · duplicate explicitly acknowledged" : ""}</td></tr>)}</tbody></table></div>
      {preview.rows.length > 200 && <small>Showing the first 200 rows; all selected valid rows will be imported.</small>}
      <button type="button" className="button" disabled={busy || !selected.size || Boolean(batch)} onClick={commit}>{busy?"Importing…":`Import ${selected.size} reviewed rows`}</button>
      {batch && <button type="button" className="button secondary" disabled={busy} onClick={rollback}>Undo unchanged records from this import</button>}
    </div>}
  </section>;
}
