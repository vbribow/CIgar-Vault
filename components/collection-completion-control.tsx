"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataMode } from "@/lib/config";

type Props = {
  collectionId:string;
  mode:DataMode;
  missingComponents:number;
  retailMissing:number;
  identityReview:number;
};

export function CollectionCompletionControl({collectionId,mode,missingComponents,retailMissing,identityReview}:Props){
  const router=useRouter();
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  const ready=missingComponents===0&&retailMissing===0&&identityReview===0;

  async function reconcile(){
    if(!window.confirm("Confirm that you own this complete presentation. Cedriva will create only missing documented components, preserve existing inventory, and reuse exact-match prices when available."))return;
    const founderKey=mode==="smartsheet"?window.prompt("Founder write key"):"";
    if(mode==="smartsheet"&&founderKey===null)return;
    const headers={...(founderKey?{"x-founder-key":founderKey}:{})};
    setBusy(true);setMessage("");
    try{
      const populated=await fetch(`/api/collections/${encodeURIComponent(collectionId)}/populate`,{method:"POST",headers});
      const population=await populated.json();
      if(!populated.ok)throw new Error(population.error||"Collection reconciliation failed");
      const priced=await fetch("/api/retail-prices/autofill",{method:"POST",headers});
      const pricing=await priced.json();
      if(!priced.ok)throw new Error(pricing.error||"Retail price reuse failed");
      const changed=(population.data?.created||0)+(population.data?.linked||0)+(population.data?.repaired||0);
      setMessage(`${changed} component record${changed===1?"":"s"} reconciled · ${pricing.data?.updated||0} exact-match price${pricing.data?.updated===1?"":"s"} applied. Remaining research is ready.`);
      router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Collection completion failed")}
    finally{setBusy(false)}
  }

  return <section className="collectionCompletionControl" aria-label="Collection completion">
    <div><div className="eyebrow">Completion engine</div><h2>{ready?"Collection record complete":"Finish this collection"}</h2><p>Cedriva reconciles documented contents first, reuses exact-match value evidence, then isolates only the records that still need research.</p></div>
    <div className="collectionCompletionSteps">
      <span data-complete={missingComponents===0}><b>{missingComponents===0?"✓":missingComponents}</b> component{missingComponents===1?"":"s"} missing</span>
      <span data-complete={identityReview===0}><b>{identityReview===0?"✓":identityReview}</b> identit{identityReview===1?"y":"ies"} to review</span>
      <span data-complete={retailMissing===0}><b>{retailMissing===0?"✓":retailMissing}</b> retail price{retailMissing===1?"":"s"} missing</span>
    </div>
    <div className="collectionCompletionActions">
      {(missingComponents>0||identityReview>0)&&<button className="button" type="button" disabled={busy||mode==="mock"} onClick={reconcile}>{busy?"Reconciling collection…":missingComponents>0?"Complete This Collection":"Refresh Researched Identities"}</button>}
      {retailMissing>0&&<Link className={`button ${missingComponents>0?"secondary":""}`} href={`/valuations?collectionId=${encodeURIComponent(collectionId)}`}>Finish value research</Link>}
      {ready&&<Link className="button secondary" href={`/valuations?collectionId=${encodeURIComponent(collectionId)}`}>Review value evidence</Link>}
    </div>
    {message&&<output aria-live="polite">{message}</output>}
  </section>;
}
