"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem } from "@/lib/types";

type Outcome={inventoryId:string;status:"saved"|"review"|"failed";message:string};
const BATCH_SIZE=6;

async function json(response:Response){const value=await response.json();if(!response.ok)throw new Error(value.error||"Valuation request failed");return value}

export function ValuationCompletionPanel({items,mode,deferredCount=0}:{items:InventoryItem[];mode:DataMode;deferredCount?:number}){
  const router=useRouter(),[key,setKey]=useState(""),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[outcomes,setOutcomes]=useState<Outcome[]>([]);
  const queue=items.slice(0,BATCH_SIZE);
  async function complete(item:InventoryItem):Promise<Outcome>{
    try{
      const headers={"Content-Type":"application/json",...(key?{"x-founder-key":key}:{})};
      const researched=await json(await fetch("/api/valuation-research",{method:"POST",headers,body:JSON.stringify({inventoryId:item.inventoryId})}));
      const draft=researched.data;
      if(!draft.sourceUrl||draft.confidence==="Low"||(draft.replacementValue===null&&draft.marketValue===null)){
        await json(await fetch("/api/valuations",{method:"POST",headers,body:JSON.stringify({
          valuationId:`VAL-REVIEW-${item.inventoryId}-${Date.now().toString(36).toUpperCase()}`.slice(0,190),
          inventoryId:item.inventoryId,valuationDate:draft.evidenceDate,marketEvidenceType:"Insufficient evidence",
          comparableCount:draft.comparables.length,source:draft.source||"Cedriva research review",
          sourceUrl:draft.sourceUrl||undefined,confidence:draft.confidence,
          notes:`Insufficient evidence; held for human review and deferred from repeated automated research. ${draft.notes}`,
        })}));
        return{inventoryId:item.inventoryId,status:"review",message:"Research needs human review before saving."};
      }
      await json(await fetch("/api/valuations",{method:"POST",headers,body:JSON.stringify({
        valuationId:`VAL-COMPLETE-${item.inventoryId}-${Date.now().toString(36).toUpperCase()}`.slice(0,190),
        inventoryId:item.inventoryId,valuationDate:draft.evidenceDate,replacementValue:draft.replacementValue??undefined,marketValue:draft.marketValue??undefined,
        marketEvidenceType:draft.marketEvidenceType,marketRangeLow:draft.marketRangeLow??undefined,marketRangeHigh:draft.marketRangeHigh??undefined,
        askingPrice:draft.askingPrice??undefined,askingPriceSource:draft.askingPriceSource||undefined,askingPriceSourceUrl:draft.askingPriceSourceUrl||undefined,comparableCount:draft.comparables.length,
        lastSaleValue:draft.lastSaleValue??undefined,lastSaleDate:draft.lastSaleDate??undefined,lastSaleVenue:draft.lastSaleVenue??undefined,lastSaleSourceUrl:draft.lastSaleSourceUrl??undefined,
        source:draft.source,sourceUrl:draft.sourceUrl,confidence:draft.confidence,notes:`Cedriva valuation completion batch. ${draft.notes}`,
      })}));
      return{inventoryId:item.inventoryId,status:"saved",message:"Source-backed valuation saved."};
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
  return <section className="valuationCompletion">
    <div><div className="eyebrow">Valuation completion</div><h2>{queue.length?`Finish the next ${queue.length} inventory records`:deferredCount?`${deferredCount} records require evidence or identity review`:"Current valuation queue is clear"}</h2><p>Researches exact cigar identity in pairs, saves only source-linked Medium or High confidence evidence, and holds uncertain matches for human review.</p></div>
    <div className="completionActions">
      {mode==="smartsheet"&&<label><span>Founder write key</span><input type="password" value={key} onChange={event=>setKey(event.target.value)} placeholder="Required for master inventory"/></label>}
      <button className="button" disabled={busy||!queue.length||(mode==="smartsheet"&&!key)} onClick={run}>{busy?`Researching ${progress} of ${queue.length}…`:queue.length?`Complete next ${queue.length}`:deferredCount?"Review deferred records":"Queue clear"}</button>
      <small>{queue.length?"Keep this page open while the batch runs. Existing values are never overwritten without new evidence.":deferredCount?"Cedriva will not claim coverage while exact identity, evidence, or the research waiting period remains unresolved.":"Every active lot is current under the present evidence policy."}</small>
    </div>
    {outcomes.length>0&&<div className="completionResults">{outcomes.map(item=><span data-status={item.status} key={item.inventoryId}><strong>{item.inventoryId}</strong>{item.message}</span>)}</div>}
  </section>;
}
