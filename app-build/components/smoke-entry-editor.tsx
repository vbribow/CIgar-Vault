"use client";

import { FormEvent, useState } from "react";
import type { DataMode } from "@/lib/config";
import { burnQualityOptions, constructionQualityOptions } from "@/lib/records-model";
import { recordRevision } from "@/lib/record-revision";
import type { SmokingLog } from "@/lib/types";
import { flavorOptions, strengthOptions } from "@/components/records-manager";

const scores = Array.from({ length:101 }, (_, index) => 100 - index);

export function SmokeEntryEditor({ smoke, mode, onSaved, onCancel }: { smoke:SmokingLog; mode:DataMode; onSaved:(smoke:SmokingLog)=>void; onCancel:()=>void }) {
  const [busy,setBusy]=useState(false), [message,setMessage]=useState("");
  const [outsideInventory,setOutsideInventory]=useState(smoke.outsideInventory===true);
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(busy)return; const form=event.currentTarget, values=new FormData(form); setBusy(true); setMessage("");
    const payload:Record<string,unknown>={dateSmoked:String(values.get("dateSmoked")||"")};
    for(const key of ["vintage","overall","flavor","strength","construction","burn","tastingNotes"]){const value=String(values.get(key)||"").trim();if(value)payload[key]=key==="overall"?Number(value):value}
    payload.buyAgain=values.get("buyAgain")==="on";
    if(smoke.inventoryId==="MANUAL"){
      payload.cigarName=String(values.get("cigarName")||"").trim();
      payload.outsideInventory=values.get("outsideInventory")==="on";
      for(const key of ["cigarBrand","cigarLine","cigarVitola"]){const value=String(values.get(key)||"").trim();if(value)payload[key]=value}
    }
    try{const response=await fetch(`/api/smoking-log/${encodeURIComponent(smoke.smokeId)}`,{method:"PUT",headers:{"Content-Type":"application/json","If-Match":recordRevision(smoke),"x-founder-key":String(values.get("writeKey")||"")},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Correction failed");onSaved(result.data);setMessage("Smoking entry updated. Vault quantity was not changed.")}
    catch(error){setMessage(error instanceof Error?error.message:"Correction failed")}finally{setBusy(false)}
  }
  return <form className="recordForm smokeEntryEdit" onSubmit={save} aria-busy={busy}>
    <h3>Edit smoking entry</h3><p className="small">Correct the experience. Vault-linked identity and quantity remain protected; a review-only entry can be explicitly classified as an outside-Vault cigar.</p>
    {smoke.inventoryId==="MANUAL"&&<fieldset className="outsideVaultIdentity"><legend>Outside-Vault identity</legend>
      <label><span>What did you smoke? *</span><input name="cigarName" required minLength={3} maxLength={300} defaultValue={smoke.cigarName||""}/></label>
      <label className="check"><input name="outsideInventory" type="checkbox" checked={outsideInventory} onChange={event=>setOutsideInventory(event.target.checked)}/> I smoked this cigar outside my Vault and confirm the identity below is exact.</label>
      {outsideInventory&&<div className="outsideVaultIdentityFields"><label><span>Brand *</span><input name="cigarBrand" required defaultValue={smoke.cigarBrand||""}/></label><label><span>Line or blend *</span><input name="cigarLine" required defaultValue={smoke.cigarLine||""}/></label><label><span>Exact vitola *</span><input name="cigarVitola" required defaultValue={smoke.cigarVitola||""}/></label></div>}
      <small>When scored, only this exact identity and the numeric score contribute anonymously to the Hojavía 25.</small>
    </fieldset>}
    <label><span>Date</span><input name="dateSmoked" type="date" required defaultValue={smoke.dateSmoked}/></label>
    <label><span>Score · 0–100</span><select name="overall" defaultValue={smoke.overall??""}><option value="">No score</option>{scores.map(score=><option key={score}>{score}</option>)}</select><small>Choose “No score” to remove a mistaken rating.</small></label>
    <label><span>Strength</span><select name="strength" defaultValue={smoke.strength??""}><option value="">Not rated</option>{strengthOptions.map(value=><option key={value}>{value}</option>)}</select></label>
    <label><span>Construction Quality</span><select name="construction" defaultValue={smoke.construction??""}><option value="">Not rated</option>{constructionQualityOptions.map(value=><option key={value}>{value}</option>)}</select></label>
    <label><span>Burn</span><select name="burn" defaultValue={smoke.burn??""}><option value="">Not rated</option>{burnQualityOptions.map(value=><option key={value}>{value}</option>)}</select></label>
    <label><span>Flavor notes</span><input name="flavor" list="smoke-flavor-options" defaultValue={smoke.flavor??""}/><datalist id="smoke-flavor-options">{flavorOptions.map(value=><option key={value} value={value}/>)}</datalist></label>
    <label><span>Tasting notes</span><textarea name="tastingNotes" rows={4} defaultValue={smoke.tastingNotes??""}/></label>
    <label className="check"><input name="buyAgain" type="checkbox" defaultChecked={smoke.buyAgain}/> Buy again</label>
    {mode==="smartsheet"&&<label><span>Founder write key</span><input name="writeKey" type="password" required/></label>}
    <div className="formActions"><button className="button" disabled={busy}>{busy?"Saving correction…":"Save correction"}</button><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancel</button></div>
    {message&&<output aria-live="polite">{message}</output>}
  </form>
}
