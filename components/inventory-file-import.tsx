"use client";

import { useState, type FormEvent } from "react";
import type { InventoryItem } from "@/lib/types";
import { useMutationGuard } from "@/components/use-mutation-guard";

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
  const importMutation = useMutationGuard();
  const rollbackMutation = useMutationGuard();

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
      importMutation.reset();
      rollbackMutation.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed. Nothing was imported.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview) return;
    const selectedRows = preview.rows.filter(row => row.item && selected.has(row.row));
    const duplicateCount = selectedRows.filter(row => row.duplicate).length;
    if (!selectedRows.length || !window.confirm(`Import ${selectedRows.length} reviewed inventory lot${selectedRows.length === 1 ? "" : "s"} from ${preview.fileName}? This adds new records only and will not replace existing Vault records.${duplicateCount ? ` ${duplicateCount} possible duplicate${duplicateCount === 1 ? " has" : "s have"} been explicitly selected.` : ""}`) || !importMutation.begin()) return;
    setBusy(true);
    setMessage("");
    try {
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
      importMutation.succeed();
      setMessage(`${result.data.imported} inventory lots imported safely. Existing Vault records were not replaced. ${result.data.valuationStatus} Import receipt: ${result.data.batchId}.`);
    } catch (error) {
      importMutation.fail();
      setMessage(error instanceof Error ? error.message : "Import failed. Refresh the preview before retrying.");
    } finally {
      setBusy(false);
    }
  }

  async function rollback() {
    if (!batch || !window.confirm("Undo this import? Only records that remain exactly as imported will be removed. Any record edited afterward will stay protected in your Vault.") || !rollbackMutation.begin()) return;
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
      rollbackMutation.succeed();
      setMessage(`${result.data.removed} unchanged imported lots removed.${result.data.protected ? ` ${result.data.protected} later-edited record(s) were preserved and remain in your Vault.` : ""}`);
      setBatch("");
      setPreview(undefined);
      setSelected(new Set());
      importMutation.reset();
    } catch (error) {
      rollbackMutation.fail();
      setMessage(error instanceof Error ? error.message : "Rollback failed. No records were assumed removed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="card inventoryFileImport">
    <div><div className="eyebrow">Secure inventory migration</div><h2>Import Excel or CSV</h2><p>Upload one `.xlsx` worksheet or CSV. The platform rejects macros, formulas, links, embedded objects, and unsupported files. Nothing is saved until you review and confirm.</p><p className="small">For an additional recovery point, <a className="textLink" href="/account">download a complete Vault export</a> before a large import.</p></div>
    <form onSubmit={inspect} aria-busy={busy}><input aria-label="Choose CSV or XLSX inventory file" name="file" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required disabled={busy||Boolean(batch)}/><button className="button" disabled={busy||Boolean(batch)}>{busy ? "Inspecting…" : batch ? "Import completed" : "Preview inventory"}</button></form>
    {batch&&<button type="button" className="button secondary" onClick={()=>{setBatch("");setPreview(undefined);setSelected(new Set());setMessage("");importMutation.reset();rollbackMutation.reset()}}>Import another file</button>}
    {message && <output aria-live="polite">{message}</output>}
    {preview && <div className="importPreview">
      <p><strong>{preview.valid} valid</strong> · {preview.invalid} need correction · {preview.duplicates} possible duplicates</p>
      <div className="tableWrap"><table className="table"><thead><tr><th>Use</th><th>Row</th><th>Cigar</th><th>Quantity</th><th>Review</th></tr></thead><tbody>{preview.rows.slice(0, 200).map(row => <tr key={row.row}><td><input aria-label={`Include spreadsheet row ${row.row}${row.item ? `, ${row.item.brand} ${row.item.line}` : ", invalid row"}`} type="checkbox" disabled={!row.item || busy || Boolean(batch)} checked={selected.has(row.row)} onChange={event => setSelected(current => { const next = new Set(current); event.target.checked ? next.add(row.row) : next.delete(row.row); return next; })}/></td><td>{row.row}</td><td>{row.item ? <><strong>{row.item.brand}</strong><small>{row.item.line} · {row.item.vitola}</small></> : "Invalid row"}</td><td>{row.item?.currentQty ?? "—"}</td><td>{[...row.errors, ...row.warnings].join("; ") || "Ready"}{row.duplicate && selected.has(row.row) ? " · duplicate explicitly acknowledged" : ""}</td></tr>)}</tbody></table></div>
      {preview.rows.length > 200 && <small>Showing the first 200 rows; all selected valid rows will be imported.</small>}
      <button type="button" className="button" disabled={busy || !selected.size || Boolean(batch)} onClick={commit}>{busy?"Importing…":`Import ${selected.size} reviewed rows`}</button>
      {batch && <button type="button" className="button secondary" disabled={busy} onClick={rollback}>Undo unchanged records from this import</button>}
    </div>}
  </section>;
}
