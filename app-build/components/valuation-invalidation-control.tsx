"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ValuationInvalidationControl({valuationId}:{valuationId:string}){
  const router=useRouter();
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  async function invalidate(){
    const reason=window.prompt("Why is this evidence invalid? The evidence remains in the audit trail, but it will no longer affect the cigar’s value.");
    if(!reason)return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/valuations/${encodeURIComponent(valuationId)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Evidence invalidation failed.");
      setMessage("Evidence invalidated. It no longer affects this cigar’s value.");
      router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Evidence invalidation failed.");}
    finally{setBusy(false);}
  }
  return <div>
    <button className="button secondary" type="button" disabled={busy} onClick={invalidate}>{busy?"Invalidating…":"Invalidate incorrect evidence"}</button>
    {message&&<output className="wideMessage">{message}</output>}
  </div>;
}
