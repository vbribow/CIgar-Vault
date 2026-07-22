"use client";
import { useState,type FormEvent } from "react";
import { InventoryFileImport } from "./inventory-file-import";

export function FounderImport(){
 const[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget),response=await fetch("/api/account/import-smartsheet",{method:"POST",headers:{"x-founder-key":String(form.get("writeKey")||"")}}),result=await response.json();setBusy(false);if(!response.ok){setMessage(result.error||"Import failed");return}setMessage(`${result.data.imported} records imported into your private vault.`);setTimeout(()=>window.location.reload(),1000)}
 return <><InventoryFileImport/><section className="card founderImport"><div><div className="eyebrow">Founder migration</div><h2>Import the existing Smartsheet vault</h2><p className="small">Copies inventory, collections, humidors, readings, sensors, valuations, smoking history, and activity into this account. Re-running is safe.</p></div><form onSubmit={submit}><label><span>Founder write key</span><input name="writeKey" type="password" required/></label><button className="button" disabled={busy}>{busy?"Importing…":"Import founder vault"}</button></form>{message&&<output>{message}</output>}</section></>;
}
