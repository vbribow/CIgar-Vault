"use client";
import {useRouter} from"next/navigation";
import{useState}from"react";
import type{DataMode}from"@/lib/config";
import type{InventoryItem}from"@/lib/types";

export function CollectionAssignmentReview({collectionId,items,mode}:{collectionId:string;items:InventoryItem[];mode:DataMode}){
 const router=useRouter(),[busy,setBusy]=useState(""),[message,setMessage]=useState("");
 async function unlink(item:InventoryItem){
  if(!window.confirm(`Remove ${item.brand} ${item.line} from this collection? The cigar will remain in main inventory.`))return;
  const key=mode==="smartsheet"?window.prompt("Founder write key"):"";
  if(mode==="smartsheet"&&key===null)return;
  setBusy(item.inventoryId);setMessage("");
  try{const response=await fetch(`/api/collections/${encodeURIComponent(collectionId)}/members`,{method:"DELETE",headers:{"Content-Type":"application/json","x-founder-key":key||""},body:JSON.stringify({inventoryId:item.inventoryId})}),payload=await response.json();if(!response.ok)throw new Error(payload.error||"Could not correct assignment");setMessage(`${item.brand} ${item.line} remains in inventory and is no longer assigned to this collection.`);router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Could not correct assignment")}finally{setBusy("")}
 }
 return <section className="collectionAssignmentReview"><div><strong>{items.length} assignment{items.length===1?"":"s"} need correction</strong><p>These lots do not match the researched edition and are excluded from completion and value. Removing a link never deletes the cigar from inventory.</p></div>{items.map(item=><article key={item.inventoryId}><span><strong>{item.brand} {item.line}</strong><small>{item.vitola} · {item.inventoryId}</small></span><a className="textLink" href={`/inventory/${item.inventoryId}`}>Review cigar</a><button className="button secondary" disabled={Boolean(busy)||mode==="mock"} onClick={()=>unlink(item)}>{busy===item.inventoryId?"Removing…":"Remove collection link"}</button></article>)}{message&&<output>{message}</output>}</section>
}
