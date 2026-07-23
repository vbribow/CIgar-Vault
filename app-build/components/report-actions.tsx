"use client";

import type { InsuranceScheduleRow } from "@/lib/insurance-report";

const csvCell = (value: string | number | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function ReportActions({ rows, generatedAt }: { rows: InsuranceScheduleRow[]; generatedAt: string }) {
  function downloadCsv() {
    const header = ["Inventory ID", "Cigar", "Vintage", "Packaging", "Quantity", "Unit replacement", "Scheduled value", "Storage", "Photo", "Provenance", "Verification"];
    const data = rows.map(row => [row.inventoryId, row.cigar, row.vintage, row.packaging, row.quantity, row.unitReplacement, row.scheduledValue, row.storage, row.photo ? "Yes" : "No", row.provenance ? "Yes" : "No", row.verification]);
    const csv = [header, ...data].map(record => record.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cigar-vault-insurance-schedule-${generatedAt.slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="reportActions"><button className="button" onClick={() => window.print()}>Print / save PDF</button><button className="button secondary" onClick={downloadCsv}>Download schedule CSV</button></div>;
}
