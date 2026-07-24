"use client";
import { useState,type FormEvent } from "react";
import { InventoryFileImport } from "./inventory-file-import";

export function FounderImport(){
 const[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget),response=await fetch("/api/account/import-smartsheet",{method:"POST",headers:{"x-founder-key":String(form.get("writeKey")||"")}}),result=await response.json();setBusy(false);if(!response.ok){setMessage(result.error||"Import failed");return}setMessage(`${result.data.imported} missing records added. ${result.data.preserved} existing account records preserved.`);setTimeout(()=>window.location.reload(),1500)}
 return <><InventoryFileImport/><section className="card founderImport"><div><div className="eyebrow">Founder migration</div><h2>Import missing Smartsheet records</h2><p className="small">Supabase is the authoritative private Vault. This one-way migration adds missing inventory, collections, climate records, valuations, smoking history, and activity. It never overwrites an existing account record.</p></div><form onSubmit={submit}><label><span>Founder write key</span><input name="writeKey" type="password" required/></label><button className="button" disabled={busy}>{busy?"Comparing and importing…":"Import missing founder records"}</button></form>{message&&<output>{message}</output>}</section></>;
}
