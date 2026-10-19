"use client";
import { useEffect,useState } from "react";

type Run={run_id:string;brand:string;status:string;started_at:string;error_message?:string};
type Claim={claim_id:string;brand:string;claim_type:string;scope:string;claim_value:string;source_title:string;source_url:string;source_type:string;confidence:string;decision:string};
type Data={status:string;runs:Run[];claims:Claim[];next:Array<{brand:string;priority:string;missing:string[]}>;limits:{maximumBatch:number;cooldownDays:number}};

export function ManufacturerEvidenceBatch(){
  const[data,setData]=useState<Data>();const[batchSize,setBatchSize]=useState(1);const[confirmed,setConfirmed]=useState(false);const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");const[writeKey,setWriteKey]=useState("");
  async function load(){
    try{const response=await fetch("/api/brand-research/batch",{cache:"no-store"}),result=await response.json();if(!response.ok)throw new Error(result.error||"Could not load manufacturer research");setData(result.data);}
    catch(error){setMessage(error instanceof Error?error.message:"Could not load manufacturer research");}
  }
  useEffect(()=>{void load()},[]);
  const active=data?.runs.filter(run=>["starting","queued","in_progress"].includes(run.status))||[];
  const pending=data?.claims.filter(claim=>claim.decision==="pending").slice(0,24)||[];
  async function start(){
    if(!confirmed||busy)return;setBusy(true);setMessage("");
    try{const response=await fetch("/api/brand-research/batch",{method:"POST",headers:{"Content-Type":"application/json","x-founder-key":writeKey},body:JSON.stringify({batchSize,confirmCreditSpend:true})}),result=await response.json();if(!response.ok)throw new Error(result.error||"Research could not start");setMessage(`${result.data.started.length} manufacturer research job${result.data.started.length===1?"":"s"} started. No more than ${batchSize} paid searches were authorized.`);setConfirmed(false);await load();}
    catch(error){setMessage(error instanceof Error?error.message:"Research could not start");}finally{setBusy(false)}
  }
  async function review(claimId:string,decision:"approved"|"rejected"){
    setBusy(true);setMessage("");
    try{const response=await fetch("/api/brand-research/batch",{method:"PATCH",headers:{"Content-Type":"application/json","x-founder-key":writeKey},body:JSON.stringify({claimId,decision})}),result=await response.json();if(!response.ok)throw new Error(result.error||"Review could not save");setMessage(`Evidence ${decision}.`);await load();}
    catch(error){setMessage(error instanceof Error?error.message:"Review could not save");}finally{setBusy(false)}
  }
  return <section className="approvalSection manufacturerBatch" id="manufacturer-batches">
    <div className="researchSectionHead"><div><div className="eyebrow">Credit-controlled manufacturer evidence</div><h2>Build the Brand Universe in small, reusable batches.</h2></div><p>Each researched brand is held for 180 days before it can use another paid search. Exact source-linked evidence is saved once and reused across every collector.</p></div>
    <div className="researchMetrics"><article><strong>{active.length}</strong><span>research jobs active</span></article><article><strong>{pending.length}</strong><span>claims awaiting review</span></article><article><strong>{data?.claims.filter(claim=>["auto_approved","approved"].includes(claim.decision)).length||0}</strong><span>approved claims</span></article><article><strong>{data?.next.length||0}</strong><span>next priorities shown</span></article></div>
    <div className="brandResearchRunner"><div><strong>Authorize one bounded batch</strong><p>Start with one brand. Raise the batch only when the prior results and credit use are acceptable.</p></div><div className="brandResearchRunControls"><label><span>Founder write key</span><input type="password" value={writeKey} onChange={event=>setWriteKey(event.target.value)} placeholder="Required before paid research"/></label><label><span>Brands this batch</span><select value={batchSize} onChange={event=>setBatchSize(Number(event.target.value))}><option value="1">1 brand · recommended</option><option value="2">2 brands</option><option value="3">3 brands · maximum</option></select></label><label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/> I approve up to {batchSize} paid public-web research search{batchSize===1?"":"es"} for this batch.</label><button className="button" type="button" disabled={!confirmed||!writeKey||busy||active.length>0} onClick={start}>{busy?"Working…":active.length?"Finish active batch first":`Research next ${batchSize}`}</button><button className="button secondary" type="button" disabled={busy} onClick={load}>Refresh status</button></div></div>
    {message&&<output className="wideMessage" aria-live="polite">{message}</output>}
    <div className="backlogGrid">{(data?.next||[]).map((item,index)=><article key={item.brand}><header><span>Next {index+1}</span><strong>{item.priority}</strong></header><h3>{item.brand}</h3><div>{item.missing.map(field=><span key={field}>{field}</span>)}</div></article>)}</div>
    {pending.length>0&&<section className="brandResearchReport"><header><div><div className="eyebrow">Human review queue</div><h2>Claims that were not safe to auto-approve</h2></div><label><span>Founder write key</span><input type="password" value={writeKey} onChange={event=>setWriteKey(event.target.value)} placeholder="Required for decisions"/></label></header><div className="brandResearchReportGrid">{pending.map(claim=><article key={claim.claim_id}><span>{claim.claim_type} · {claim.source_type}</span><h3>{claim.brand}</h3><strong>{claim.claim_value}</strong><small>{claim.scope} · {claim.confidence} confidence</small><a href={claim.source_url} target="_blank" rel="noreferrer">{claim.source_title} ↗</a><div><button className="button secondary" disabled={busy||!writeKey} onClick={()=>review(claim.claim_id,"approved")}>Approve evidence</button><button className="textLink" disabled={busy||!writeKey} onClick={()=>review(claim.claim_id,"rejected")}>Reject</button></div></article>)}</div></section>}
  </section>;
}
