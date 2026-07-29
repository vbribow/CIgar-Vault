"use client";

import { useRouter } from "next/navigation";
import { useEffect,useRef,useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem } from "@/lib/types";

type Outcome={inventoryId:string;status:"saved"|"review"|"failed";message:string};
const BATCH_SIZE=6;

async function json(response:Response){const value=await response.json();if(!response.ok)throw new Error(value.error||"Valuation request failed");return value}

export function ValuationCompletionPanel({items,mode,deferredCount=0}:{items:InventoryItem[];mode:DataMode;deferredCount?:number}){
  const router=useRouter(),[key,setKey]=useState(""),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[outcomes,setOutcomes]=useState<Outcome[]>([]),[automaticConfigured,setAutomaticConfigured]=useState<boolean|null>(null);
  const submissionIds=useRef(new Map<string,string>());
  const automaticRunStarted=useRef(false);
  const queue=items.slice(0,BATCH_SIZE);
  async function complete(item:InventoryItem):Promise<Outcome>{
    try{
      const submissionId=submissionIds.current.get(item.inventoryId)||crypto.randomUUID();
      submissionIds.current.set(item.inventoryId,submissionId);
      const headers={"Content-Type":"application/json",...(key?{"x-founder-key":key}:{})};
      const researched=await json(await fetch("/api/valuation-research",{method:"POST",headers,body:JSON.stringify({inventoryId:item.inventoryId})}));
      const draft=researched.data;
      if(!draft.automaticSaveEligible){
        await json(await fetch("/api/valuations",{method:"POST",headers,body:JSON.stringify({
          submissionId,
          inventoryId:item.inventoryId,valuationDate:draft.evidenceDate,marketEvidenceType:"Insufficient evidence",
          comparableCount:draft.comparables.length,source:draft.source||"Independent research review",
          sourceUrl:draft.sourceUrl||undefined,confidence:draft.confidence,
          notes:`Insufficient evidence; held for human review and deferred from repeated automated research. ${draft.notes}`,
        })}));
        submissionIds.current.delete(item.inventoryId);return{inventoryId:item.inventoryId,status:"review",message:"Research needs human review before saving."};
      }
      await json(await fetch("/api/valuations",{method:"POST",headers,body:JSON.stringify({
        submissionId,
        inventoryId:item.inventoryId,valuationDate:draft.evidenceDate,replacementValue:draft.replacementValue??undefined,marketValue:draft.marketValue??undefined,
        marketEvidenceType:draft.marketEvidenceType,marketRangeLow:draft.marketRangeLow??undefined,marketRangeHigh:draft.marketRangeHigh??undefined,
        askingPrice:draft.askingPrice??undefined,askingPriceSource:draft.askingPriceSource||undefined,askingPriceSourceUrl:draft.askingPriceSourceUrl||undefined,comparableCount:draft.comparables.length,
        lastSaleValue:draft.lastSaleValue??undefined,lastSaleDate:draft.lastSaleDate??undefined,lastSaleVenue:draft.lastSaleVenue??undefined,lastSaleSourceUrl:draft.lastSaleSourceUrl??undefined,
        source:draft.source,sourceUrl:draft.sourceUrl,confidence:draft.confidence,notes:`Valuation completion batch. ${draft.notes}`,
      })}));
      submissionIds.current.delete(item.inventoryId);return{inventoryId:item.inventoryId,status:"saved",message:"Source-backed valuation saved."};
    }catch(error){return{inventoryId:item.inventoryId,status:"failed",message:error instanceof Error?error.message:"Valuation failed"}}
  }
  async function run(){
    if(!queue.length)return;
    setBusy(true);setProgress(0);setOutcomes([]);
    const results:Outcome[]=[];
    for(let index=0;index<queue.length;index+=2){
      const next=await Promise.all(queue.slice(index,index+2).map(complete));
      results.push(...next);setOutcomes([...results]);setProgress(results.length);
    }
    setBusy(false);router.refresh();
  }
  useEffect(()=>{
    if(mode!=="supabase"||!queue.length||automaticRunStarted.current)return;
    automaticRunStarted.current=true;
    void (async()=>{
      try{
        const [preferencesResponse,readinessResponse]=await Promise.all([
          fetch("/api/account/preferences",{cache:"no-store"}),
          fetch("/api/valuation-research",{cache:"no-store"})
        ]);
        const [preferences,readiness]=await Promise.all([preferencesResponse.json(),readinessResponse.json()]);
        const configured=readinessResponse.ok&&readiness.data?.configured===true;
        setAutomaticConfigured(configured);
        if(preferencesResponse.ok&&preferences.data?.valuationResearch!==false&&configured)await run();
      }catch{
        setAutomaticConfigured(false);
        // The hourly background monitor remains authoritative when an
        // immediate signed-in acceleration cannot start.
      }
    })();
  },[mode,queue.length]);
  return <section className="valuationCompletion">
    <div><div className="eyebrow">Automated valuation completion</div><h2>{busy?`Researching ${progress} of ${queue.length} priority records`:queue.length?`${queue.length} priority records are queued`:deferredCount?`Current queue is clear · ${deferredCount} evidence gap${deferredCount===1?"":"s"} deferred`:"Current valuation queue is clear"}</h2><p>Missing and stale values are checked automatically. Exact cigar identity, a recorded Fox Cigar verification, direct sources, and Medium or High confidence are required before a price can save.</p></div>
    <div className="completionActions">
      {mode==="smartsheet"&&<label><span>Founder write key</span><input type="password" value={key} onChange={event=>setKey(event.target.value)} placeholder="Required for master inventory"/></label>}
      <button className="button" disabled={busy||!queue.length||(mode==="smartsheet"&&!key)} onClick={run}>{busy?`Researching ${progress} of ${queue.length}…`:queue.length?`Run next ${queue.length} now`:"Queue clear"}</button>
      <small>{queue.length?"The production monitor checks the queue hourly; opening this workspace accelerates the next batch immediately. Existing values are never overwritten without new evidence.":deferredCount?`Every active lot is current under the present evidence policy. ${deferredCount} evidence gap${deferredCount===1?" is":"s are"} retained for the next scheduled review; no price has been invented.`:"Every active lot is current under the present evidence policy."}</small>
      {automaticConfigured===false&&<small role="status">Automatic research is prepared but waiting for its secure research connection. Manual evidence entry remains available.</small>}
    </div>
    {outcomes.length>0&&<div className="completionResults">{outcomes.map(item=><span data-status={item.status} key={item.inventoryId}><strong>{item.inventoryId}</strong>{item.message}</span>)}</div>}
  </section>;
}
