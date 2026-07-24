"use client";

import { useState } from "react";
import type { InsuranceScheduleRow } from "@/lib/insurance-report";
import { buildInsurancePdf } from "@/lib/insurance-pdf";

const csvCell = (value: string | number | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function ReportActions({ rows, generatedAt }: { rows: InsuranceScheduleRow[]; generatedAt: string }) {
  const[message,setMessage]=useState("");
  function deliver(bytes:BlobPart,type:string,filename:string){
    const url=URL.createObjectURL(new Blob([bytes],{type})),anchor=document.createElement("a");
    anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1_000);
    setMessage(`Downloaded ${filename}`);
  }
  function downloadPdf(){
    try{deliver(buildInsurancePdf(rows,generatedAt),"application/pdf",`cedriva-insurance-schedule-${generatedAt.slice(0,10)}.pdf`)}
    catch(error){setMessage(error instanceof Error?error.message:"Unable to create the insurance PDF.")}
  }
  function downloadCsv() {
    const header = ["Inventory ID", "Cigar", "Vintage", "Packaging", "Quantity", "Unit replacement", "Scheduled value", "Storage", "Photo", "Provenance", "Verification"];
    const data = rows.map(row => [row.inventoryId, row.cigar, row.vintage, row.packaging, row.quantity, row.unitReplacement, row.scheduledValue, row.storage, row.photo ? "Yes" : "No", row.provenance ? "Yes" : "No", row.verification]);
    const csv = [header, ...data].map(record => record.map(csvCell).join(",")).join("\n");
    deliver(csv,"text/csv;charset=utf-8",`cedriva-insurance-schedule-${generatedAt.slice(0,10)}.csv`);
  }

  return <div className="reportActions"><button className="button" onClick={downloadPdf}>Download insurance PDF</button><button className="button secondary" onClick={downloadCsv}>Download schedule CSV</button><button className="textLink" onClick={()=>window.print()}>Print this page</button>{message&&<output aria-live="polite">{message}</output>}</div>;
}
