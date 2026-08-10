"use client";

import { useState } from "react";
import type { InventoryItem } from "@/lib/types";
import { recordRevision } from "@/lib/record-revision";

export function InventoryRecordActions({item,editHref}:{item:InventoryItem;editHref:string}){
  const[deleting,setDeleting]=useState(false);
  const[message,setMessage]=useState("");
  async function remove(){
    if(!window.confirm(`Delete ${item.inventoryId} — ${item.brand} ${item.line}? The inventory row will be removed. Retained historical evidence is not silently erased.`))return;
    setDeleting(true);setMessage("");
    try{
      const response=await fetch(`/api/inventory/${encodeURIComponent(item.inventoryId)}`,{method:"DELETE",headers:{"If-Match":recordRevision(item)}});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||"Delete failed");
      window.location.assign("/inventory#inventory-records");
    }catch(error){setMessage(error instanceof Error?error.message:"Delete failed. Check your connection and try again.");}
    finally{setDeleting(false);}
  }
  return <div style={{display:"contents"}} aria-busy={deleting}>
    <a className="button" href={editHref}>Edit all details</a>
    <button className="button danger" type="button" disabled={deleting} onClick={remove}>{deleting?"Deleting…":"Delete record"}</button>
    {message&&<output aria-live="polite">{message}</output>}
  </div>;
}
