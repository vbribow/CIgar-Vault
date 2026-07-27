"use client";

import { useState } from "react";
import type { InsuranceScheduleRow } from "@/lib/insurance-report";

const csvCell = (value: string | number | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function ReportActions({ rows, generatedAt }: { rows: InsuranceScheduleRow[]; generatedAt: string }) {
  const[message,setMessage]=useState(""),[downloading,setDownloading]=useState(false);
  function deliver(bytes:BlobPart,type:string,filename:string){
    const url=URL.createObjectURL(new Blob([bytes],{type})),anchor=document.createElement("a");
    anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1_000);
    setMessage(`Downloaded ${filename}`);
  }
  async function downloadPdf(){
    if(downloading)return;
    setDownloading(true);setMessage("Preparing your private insurance PDF…");
    try{
      const response=await fetch("/api/reports/insurance-pdf",{cache:"no-store",credentials:"include"});
      if(!response.ok){
        const result=await response.json().catch(()=>({}));
        throw new Error(result.error||"Cedriva could not prepare the insurance PDF. Please try again.");
      }
      const blob=await response.blob();
      if(!blob.size||blob.type!=="application/pdf")throw new Error("Cedriva received an incomplete PDF. Please try again.");
      const disposition=response.headers.get("content-disposition")||"";
      const filename=disposition.match(/filename="?([^";]+)"?/i)?.[1]||`cedriva-insurance-schedule-${generatedAt.slice(0,10)}.pdf`;
      deliver(blob,"application/pdf",filename);
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to create the insurance PDF.")}
    finally{setDownloading(false)}
  }
  function downloadCsv() {
    const header = ["Inventory ID", "Cigar", "Vintage", "Packaging", "Quantity", "Unit replacement", "Scheduled value", "Storage", "Photo", "Provenance", "Verification"];
    const data = rows.map(row => [row.inventoryId, row.cigar, row.vintage, row.packaging, row.quantity, row.unitReplacement, row.scheduledValue, row.storage, row.photo ? "Yes" : "No", row.provenance ? "Yes" : "No", row.verification]);
    const csv = [header, ...data].map(record => record.map(csvCell).join(",")).join("\n");
    deliver(csv,"text/csv;charset=utf-8",`cedriva-insurance-schedule-${generatedAt.slice(0,10)}.csv`);
  }

  return <div className="reportActions" aria-busy={downloading}><button className="button" disabled={downloading} onClick={downloadPdf}>{downloading?"Preparing secure PDF…":"Download insurance PDF"}</button><button className="button secondary" disabled={downloading} onClick={downloadCsv}>Download schedule CSV</button><button className="textLink" disabled={downloading} onClick={()=>window.print()}>Print this page</button>{message&&<output aria-live="polite" aria-atomic="true">{message}</output>}</div>;
}
