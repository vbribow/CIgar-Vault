"use client";
import { useMemo,useState } from "react";
import type { CatalogCigar } from "@/lib/types";
import { classifyDiscovery } from "@/lib/brand-research";
import { groupCatalogDiscoveries,type CatalogDiscoveryRelease } from "@/lib/catalog-discovery";

type Decision="Approved"|"Rejected";

function unique(values:Array<string|undefined>){return [...new Set(values.map(value=>value?.trim()).filter((value):value is string=>Boolean(value)))]}
function confidence(item:CatalogCigar){return item.masterNotes?.match(/Confidence:\s*(High|Medium|Low)/i)?.[1]||"Unrated"}
function sourceLabel(url:string){try{return new URL(url).hostname.replace(/^www\./,"")}catch{return"Evidence source"}}

function releaseSummary(release:CatalogDiscoveryRelease,classes:Map<string,string>){
  const sources=unique(release.items.map(item=>item.sourceUrl));
  const countries=unique(release.items.map(item=>item.country));
  const factories=unique(release.items.map(item=>item.factory));
  const confidences=unique(release.items.map(confidence));
  const flags:string[]=[];
  if(release.items.some(item=>classes.get(item.catalogId)==="Possible duplicate"))flags.push("Possible duplicate");
  if(confidences.some(value=>value!=="High"))flags.push(`${confidences.join(" / ")} confidence`);
  if(countries.length>1)flags.push("Country conflict");
  if(factories.length>1)flags.push("Factory conflict");
  if(!sources.length)flags.push("Source missing");
  return{sources,countries,factories,confidences,flags};
}

export function CatalogDiscoveryReview({initialItems,existingCatalog}:{initialItems:CatalogCigar[];existingCatalog:CatalogCigar[]}){
  const[items,setItems]=useState(initialItems);
  const[selected,setSelected]=useState<Set<string>>(new Set());
  const[key,setKey]=useState("");
  const[message,setMessage]=useState("");
  const[running,setRunning]=useState(false);
  const[reviewing,setReviewing]=useState("");
  const classifications=useMemo(()=>new Map(items.map(item=>[item.catalogId,classifyDiscovery(item,existingCatalog)])),[items,existingCatalog]);
  const releases=useMemo(()=>groupCatalogDiscoveries(items),[items]);
  const selectedReleases=releases.filter(release=>selected.has(release.key));
  const chosen=selectedReleases.flatMap(release=>release.items);

  function update(id:string,field:keyof CatalogCigar,value:string){
    setItems(current=>current.map(item=>item.catalogId===id?{...item,[field]:value}:item));
  }

  function toggleRelease(release:CatalogDiscoveryRelease,checked:boolean){
    setSelected(current=>{const next=new Set(current);checked?next.add(release.key):next.delete(release.key);return next});
  }

  async function decide(reviewItems:CatalogCigar[],decision:Decision,label:string){
    setMessage("");
    setReviewing(label);
    try{
      const response=await fetch("/api/catalog-discovery/review",{method:"POST",headers:{"Content-Type":"application/json","x-founder-key":key},body:JSON.stringify({items:reviewItems,decision})});
      const result=await response.json();
      if(!response.ok){setMessage(result.error||"Review failed");return}
      const ids=new Set(reviewItems.map(item=>item.catalogId));
      setItems(current=>current.filter(item=>!ids.has(item.catalogId)));
      setSelected(current=>{const next=new Set(current);for(const release of groupCatalogDiscoveries(reviewItems))next.delete(release.key);return next});
      setMessage(`${label} ${decision.toLowerCase()}. ${reviewItems.length} exact cigar record${reviewItems.length===1?"":"s"} processed together.`);
    }catch{
      setMessage("Review could not be completed. Check the connection and try again.");
    }finally{
      setReviewing("");
    }
  }

  async function runNow(){
    setRunning(true);
    setMessage("");
    try{
      const response=await fetch("/api/catalog-discovery/run",{headers:{"x-founder-key":key}});
      const result=await response.json();
      if(!response.ok){setMessage(result.error||"Discovery failed");return}
      setMessage(`Scan complete: ${result.data.newDiscoveries} new exact cigars queued. Refresh once to see them grouped by release.`);
    }catch{
      setMessage("Discovery could not be completed. Check the connection and try again.");
    }finally{
      setRunning(false);
    }
  }

  return <>
    <section className="discoveryControls">
      <label><span>Founder write key</span><input type="password" value={key} onChange={event=>setKey(event.target.value)} placeholder="Required for discovery and review"/></label>
      <button className="button" disabled={!key||running||Boolean(reviewing)} onClick={runNow}>{running?"Searching trusted sources…":"Run discovery now"}</button>
      {chosen.length>0&&<div className="discoveryBulkActions">
        <span>{selectedReleases.length} release{selectedReleases.length===1?"":"s"} · {chosen.length} cigars</span>
        <button className="button secondary" disabled={!key||Boolean(reviewing)} onClick={()=>decide(chosen,"Approved",`${selectedReleases.length} selected release${selectedReleases.length===1?"":"s"}`)}>Approve selected</button>
        <button className="button secondary" disabled={!key||Boolean(reviewing)} onClick={()=>decide(chosen,"Rejected",`${selectedReleases.length} selected release${selectedReleases.length===1?"":"s"}`)}>Reject selected</button>
      </div>}
      {message&&<output>{message}</output>}
    </section>
    <section className="releaseQueue">
      {releases.map(release=>{
        const summary=releaseSummary(release,classifications);
        const label=`${release.brand} ${release.line}`;
        const busy=reviewing===label;
        return <article key={release.key} className={summary.flags.length?"releaseCard needsReview":"releaseCard sourceReady"}>
          <header className="releaseHeader">
            <label className="releaseSelect"><input type="checkbox" checked={selected.has(release.key)} onChange={event=>toggleRelease(release,event.target.checked)}/><span>Select release</span></label>
            <div className="releaseIdentity">
              <span className="eyebrow">{release.brand}</span>
              <h2>{release.line}</h2>
              <p>{release.items.length} documented size{release.items.length===1?"":"s"} from {summary.sources.length||"no"} source{summary.sources.length===1?"":"s"}</p>
            </div>
            <div className="releaseState">
              <strong>{summary.flags.length?"Review exception":"Source-ready"}</strong>
              <span>{summary.flags.length?summary.flags.join(" · "):"No identity conflicts detected"}</span>
            </div>
          </header>
          <div className="releaseVitolas">{release.items.map(item=><span key={item.catalogId}>{item.vitola}</span>)}</div>
          <div className="releaseEvidence">
            <div><small>Country</small><strong>{summary.countries.join(" / ")||"Unresolved"}</strong></div>
            <div><small>Factory</small><strong>{summary.factories.join(" / ")||"Open research gap"}</strong></div>
            <div><small>Confidence</small><strong>{summary.confidences.join(" / ")}</strong></div>
            <div className="releaseSources"><small>Evidence</small>{summary.sources.map(source=><a key={source} href={source} target="_blank" rel="noreferrer">{sourceLabel(source)} ↗</a>)}</div>
          </div>
          <details className="releaseDetails">
            <summary>Review or edit {release.items.length} individual record{release.items.length===1?"":"s"}</summary>
            <div className="releaseRecords">{release.items.map(item=><section key={item.catalogId} className={classifications.get(item.catalogId)==="Possible duplicate"?"possibleDuplicate":""}>
              <div className="recordHeading"><strong>{item.vitola}</strong><span>{classifications.get(item.catalogId)}</span></div>
              <div className="discoveryFields">
                <label><span>Brand</span><input value={item.brand} onChange={event=>update(item.catalogId,"brand",event.target.value)}/></label>
                <label><span>Blend / line</span><input value={item.line} onChange={event=>update(item.catalogId,"line",event.target.value)}/></label>
                <label><span>Vitola</span><input value={item.vitola} onChange={event=>update(item.catalogId,"vitola",event.target.value)}/></label>
                <label><span>Country</span><input value={item.country||""} onChange={event=>update(item.catalogId,"country",event.target.value)}/></label>
                <label><span>Actual factory</span><input value={item.factory||""} onChange={event=>update(item.catalogId,"factory",event.target.value)} placeholder="Leave blank if unresolved"/></label>
                <label><span>Wrapper</span><input value={item.wrapper||""} onChange={event=>update(item.catalogId,"wrapper",event.target.value)} placeholder="Source-backed only"/></label>
                <label><span>Wrapper origin</span><input value={item.wrapperOrigin||""} onChange={event=>update(item.catalogId,"wrapperOrigin",event.target.value)}/></label>
                <label><span>Binder</span><input value={item.binder||""} onChange={event=>update(item.catalogId,"binder",event.target.value)} placeholder="Source-backed only"/></label>
                <label><span>Binder origin</span><input value={item.binderOrigin||""} onChange={event=>update(item.catalogId,"binderOrigin",event.target.value)}/></label>
                <label><span>Filler</span><input value={item.filler||""} onChange={event=>update(item.catalogId,"filler",event.target.value)} placeholder="Do not infer undisclosed leaf"/></label>
                <label><span>Filler origins</span><input value={item.fillerOrigins||""} onChange={event=>update(item.catalogId,"fillerOrigins",event.target.value)}/></label>
                <label><span>Dimensions</span><input value={item.dimensions||""} onChange={event=>update(item.catalogId,"dimensions",event.target.value)}/></label>
                <label><span>Stated strength</span><input value={item.strength||""} onChange={event=>update(item.catalogId,"strength",event.target.value)}/></label>
                <label><span>Packaging</span><input value={item.packaging||""} onChange={event=>update(item.catalogId,"packaging",event.target.value)}/></label>
                <label><span>Release year</span><input value={item.releaseYear||""} onChange={event=>update(item.catalogId,"releaseYear",event.target.value)}/></label>
                <label><span>Edition</span><input value={item.edition||""} onChange={event=>update(item.catalogId,"edition",event.target.value)}/></label>
                <label className="discoveryNotes"><span>Ownership, blender, classification, and evidence notes</span><textarea value={item.masterNotes||""} onChange={event=>update(item.catalogId,"masterNotes",event.target.value)} rows={3}/></label>
                {item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noreferrer">Review exact source ↗</a>}
              </div>
            </section>)}</div>
          </details>
          <footer className="releaseActions">
            <span>One decision applies to every documented size in this release.</span>
            <button className="button" disabled={!key||Boolean(reviewing)} onClick={()=>decide(release.items,"Approved",label)}>{busy?"Saving…":`Approve release (${release.items.length})`}</button>
            <button className="button secondary" disabled={!key||Boolean(reviewing)} onClick={()=>decide(release.items,"Rejected",label)}>Reject release</button>
          </footer>
        </article>
      })}
      {!releases.length&&<div className="emptyState"><strong>The review queue is clear.</strong><p>Run discovery now or wait for the weekly scheduled scan.</p></div>}
    </section>
  </>;
}
