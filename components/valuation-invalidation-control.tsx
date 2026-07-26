"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ValuationInvalidationControl({valuationId}:{valuationId:string}){
  const router=useRouter();
  const[busy,setBusy]=useState(false);
  const[open,setOpen]=useState(false);
  const[reason,setReason]=useState("");
  const[message,setMessage]=useState("");
  async function invalidate(){
    if(reason.trim().length<10){setMessage("Explain why this evidence is invalid.");return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/valuations/${encodeURIComponent(valuationId)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Evidence invalidation failed.");
      setMessage("Evidence invalidated. It no longer affects this cigar’s value.");
      setOpen(false);
      router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Evidence invalidation failed.");}
    finally{setBusy(false);}
  }
  return <div>
    {!open?<button className="button secondary" type="button" disabled={busy} onClick={()=>setOpen(true)}>Invalidate incorrect evidence</button>:<div className="recordForm">
      <label><span>Correction reason</span><textarea aria-label="Correction reason" value={reason} onChange={event=>setReason(event.target.value)} placeholder="Explain why this evidence must not affect the cigar’s value."/></label>
      <div className="ctaRow"><button className="button secondary" type="button" disabled={busy||reason.trim().length<10} onClick={invalidate}>{busy?"Invalidating…":"Confirm invalidation"}</button><button className="button ghost" type="button" disabled={busy} onClick={()=>setOpen(false)}>Cancel</button></div>
    </div>}
    {message&&<output className="wideMessage">{message}</output>}
  </div>;
}
