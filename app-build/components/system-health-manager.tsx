"use client";

import { useState } from "react";
import { latestRuns,systemJobs,type SystemRun } from "@/lib/system-health";

type ValuationControls={batchSize:number;monthlyBudget:number;estimatedCostPerResearch:number};

export function SystemHealthManager({initialRuns,valuationControls}:{initialRuns:SystemRun[];valuationControls:ValuationControls}){
  const[runs,setRuns]=useState(initialRuns);
  const[key,setKey]=useState("");
  const[busy,setBusy]=useState("");
  const[message,setMessage]=useState("");
  const latest=latestRuns(runs);

  async function run(jobId:SystemRun["jobId"],batchSize?:number){
    const job=systemJobs.find(value=>value.id===jobId)!;
    const label=batchSize?`${job.name} for up to ${batchSize} ${batchSize===1?"lot":"lots"}`:job.name;
    if(!confirm(`Run ${label} now? This may call external services and update vault records.`))return;
    setBusy(batchSize?`${jobId}-${batchSize}`:jobId);
    setMessage("");
    try{
      const response=await fetch("/api/system-health/run",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jobId,writeKey:key,batchSize})});
      const result=await response.json();
      if(result.data)setRuns(current=>[result.data,...current]);
      if(!response.ok)throw new Error(result.error||"Run failed");
      setMessage(`${label} completed. ${result.data?.summary||""}`);
    }catch(error){setMessage(error instanceof Error?error.message:"Run failed")}
    finally{setBusy("")}
  }

  return <section className="healthOperations">
    <div className="operationsToolbar">
      <div><div className="eyebrow">Operational controls</div><h2>Scheduled automation</h2><p>Run a job safely and preserve its result in the private run ledger.</p></div>
      <label><span>Founder write key</span><input type="password" value={key} onChange={event=>setKey(event.target.value)} placeholder="Required to run now"/></label>
    </div>
    {message&&<output>{message}</output>}
    <div className="jobGrid">{systemJobs.map(job=>{
      const last=latest.get(job.id);
      const valuation=job.id==="valuation-monitor";
      return <article className={last?.status.toLowerCase()||"never"} key={job.id}>
        <div>
          <span>{job.nextDescription}</span><strong>{job.name}</strong><small>{job.schedule}</small>
          {valuation&&<small className="costPolicy">Immediate upload queue · 30-day refresh · exact-match evidence reuse · estimated ${valuationControls.monthlyBudget.toFixed(2)} USD monthly budget, pauses at 80%</small>}
        </div>
        <div className="jobLast"><b>{last?.status||"Never run manually"}</b><span>{last?new Date(last.completedAt).toLocaleString():"No recorded result"}</span>{last?.error&&<small>{last.error}</small>}</div>
        <div>
          {valuation&&<button className="button secondary" disabled={!key||Boolean(busy)} onClick={()=>run(job.id,1)}>{busy===`${job.id}-1`?"Testing…":"Test 1 lot"}</button>}
          <button className="button secondary" disabled={!key||Boolean(busy)} onClick={()=>run(job.id,valuation?valuationControls.batchSize:undefined)}>{busy===`${job.id}-${valuationControls.batchSize}`||busy===job.id?"Running…":valuation?`Run ${valuationControls.batchSize} lots · est. $${(valuationControls.batchSize*valuationControls.estimatedCostPerResearch).toFixed(2)}`:"Run now"}</button>
        </div>
      </article>;
    })}</div>
    <section className="runLedger">
      <div className="sectionHead"><div><div className="eyebrow">Recent operations</div><h2>Run ledger</h2></div></div>
      {runs.slice(0,12).map(run=><article key={run.runId}><span className={run.status.toLowerCase()}>{run.status}</span><strong>{systemJobs.find(job=>job.id===run.jobId)?.name}</strong><small>{new Date(run.completedAt).toLocaleString()}</small><p>{run.error||run.summary}</p></article>)}
      {!runs.length&&<div className="emptyState">No manually triggered automation runs have been recorded yet.</div>}
    </section>
  </section>;
}
