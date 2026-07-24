"use client";

import { useState } from "react";

export function PrivateRecordExport() {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function download(){
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/account/export",{cache:"no-store",credentials:"include"});
      if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||"Cedriva could not prepare your private record.")}
      const blob=await response.blob();
      if(!blob.size)throw new Error("Cedriva prepared an empty file. Please try again.");
      const disposition=response.headers.get("content-disposition")||"";
      const filename=disposition.match(/filename="?([^";]+)"?/i)?.[1]||`cedriva-private-record-${new Date().toISOString().slice(0,10)}.json`;
      const url=URL.createObjectURL(blob),anchor=document.createElement("a");
      anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1_000);
      setMessage(`Downloaded ${filename}`);
    }catch(error){setMessage(error instanceof Error?error.message:"Cedriva could not prepare your private record.")}
    finally{setBusy(false)}
  }
  return <div className="privateRecordExport"><button type="button" className="button secondary" disabled={busy} onClick={download}>{busy?"Preparing secure file…":"Export my private record"}</button>{message&&<output aria-live="polite">{message}</output>}</div>;
}
