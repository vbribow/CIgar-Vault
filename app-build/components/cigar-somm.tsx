"use client";
import{useEffect,useMemo,useState,type FormEvent}from"react";
import type{InventoryItem,SmokingLog}from"@/lib/types";
import{cleanSommText,sommLeadSummary,uniqueSommItems,type CigarSommAnswer}from"@/lib/cigar-somm";
import{rankCollectionSommCandidates}from"@/lib/collection-somm";
import{TrustMark}from"@/components/trust-mark";
import{brand}from"@/lib/brand";

const prompts=["How will this cigar develop while I smoke it?","What should I pair with this cigar after dinner?","Choose a coffee and a zero-proof pairing.","Should I smoke this now or continue aging it?"];
const identity=(item:InventoryItem)=>`${item.brand} · ${item.line} · ${item.vitola}${item.vintage?` · ${item.vintage}`:""}`;

export function CigarSomm({inventory,smokes=[],initialInventoryId="",initialCollectionId="",initialCollectionName="",initialQuestion="",initialManualName=""}:{inventory:InventoryItem[];smokes?:SmokingLog[];initialInventoryId?:string;initialCollectionId?:string;initialCollectionName?:string;initialQuestion?:string;initialManualName?:string}){
 const[source,setSource]=useState<"inventory"|"manual"|"context">(initialManualName?"manual":"inventory"),[selectedId,setSelectedId]=useState(initialInventoryId),[collectionChoiceConfirmed,setCollectionChoiceConfirmed]=useState(!initialCollectionId),[manualName,setManualName]=useState(initialManualName),[pairingContext,setPairingContext]=useState(""),[search,setSearch]=useState(""),[result,setResult]=useState<CigarSommAnswer>(),[question,setQuestion]=useState(initialQuestion),[busy,setBusy]=useState(false),[elapsed,setElapsed]=useState(0),[error,setError]=useState("");
 const available=useMemo(()=>inventory.filter(item=>(item.currentQty??0)>0).sort((a,b)=>identity(a).localeCompare(identity(b))),[inventory]);
 const matches=useMemo(()=>{const words=search.toLowerCase().trim().split(/\s+/).filter(Boolean);return available.filter(item=>words.every(word=>identity(item).toLowerCase().includes(word))).slice(0,30)},[available,search]);
 const selected=inventory.find(item=>item.inventoryId===selectedId);
 const selectOptions=useMemo(()=>selected&&!matches.some(item=>item.inventoryId===selected.inventoryId)?[selected,...matches]:matches,[matches,selected]);
 const collectionCandidates=useMemo(()=>rankCollectionSommCandidates(inventory.filter(item=>item.collectionId===initialCollectionId),smokes),[initialCollectionId,inventory,smokes]);
 const collectionChoiceRequired=Boolean(initialCollectionId)&&collectionCandidates.length>1;
 const ready=source==="inventory"?Boolean(selected)&&(!collectionChoiceRequired||collectionChoiceConfirmed):source==="manual"?manualName.trim().length>=3:pairingContext.trim().length>=3;
 useEffect(()=>{if(!busy){setElapsed(0);return}const timer=window.setInterval(()=>setElapsed(value=>value+1),1_000);return()=>window.clearInterval(timer)},[busy]);
 function chooseSource(value:"inventory"|"manual"|"context"){setSource(value);setError("");setResult(undefined)}
 function chooseCollectionCigar(inventoryId:string){setSource("inventory");setSelectedId(inventoryId);setCollectionChoiceConfirmed(true);setSearch("");setError("");setResult(undefined);if(!question.trim())setQuestion("Is this exact cigar a strong choice to smoke now, and what coffee, spirit, cocktail, and nonalcoholic pairings fit it? Separate exact evidence from general guidance and explain uncertainty.");document.querySelector(".sommCigarSelect")?.scrollIntoView({behavior:"smooth",block:"center"})}
 async function analyze(event:FormEvent<HTMLFormElement>){event.preventDefault();if(source!=="context"&&collectionChoiceRequired&&!collectionChoiceConfirmed){setError("This collection contains multiple cigars. Confirm the exact cigar before Cigar Somm can continue.");document.querySelector(".collectionSommChooser")?.scrollIntoView({behavior:"smooth",block:"start"});return}if(!ready){setError(source==="inventory"?"Choose a cigar from your vault first.":source==="manual"?"Enter the brand, line, and cigar name.":"Describe your drink, meal, time of day, or occasion.");return}const form=new FormData(event.currentTarget),request=question.trim()||(source==="context"?"Recommend the best cigars from my collection for this moment and explain why each pairing works.":"Analyze this exact cigar. Give me a conservative tasting profile, expected progression while smoking, and well-matched coffee, spirit, cocktail, and nonalcoholic pairings.");setBusy(true);setError("");setResult(undefined);try{const response=await fetch("/api/cigar-somm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:request,inventoryId:source==="inventory"?selected?.inventoryId:undefined,cigarName:source==="manual"?manualName.trim():undefined,pairingDirection:source==="context"?"occasion-to-cigar":"cigar-to-beverage",pairingContext:source==="context"?pairingContext.trim():undefined,occasion:String(form.get("occasion")||"")||undefined,includeAlcohol:form.get("includeAlcohol")==="on",collectionChoiceConfirmed:source!=="inventory"||collectionChoiceConfirmed}),signal:AbortSignal.timeout(105_000)}),value=await response.json();if(!response.ok)throw new Error(value.error||"Unable to build this pairing");setResult(value.data)}catch(value){setError(value instanceof DOMException&&value.name==="TimeoutError"?"Research took too long to complete. Please try again; your selection is still here.":value instanceof Error?value.message:"Unable to build this pairing")}finally{setBusy(false)}}
 return <>
  <div className="sommTrust">
<TrustMark kind="AI"/>
<span>Cigar Somm is AI-assisted. Its research sources and uncertainty remain visible for your review.</span>
</div>
  <section className="sommConsole">
<div className="sommIdentity">
<span>C</span>
<div>
<div className="eyebrow">Private collection guidance</div>
<h2>Pair in either direction.</h2>
<p>Start with a cigar, or tell Cigar Somm what you are drinking, eating, or celebrating and get choices from your vault.</p>
</div>
</div>{initialCollectionId&&<section className="collectionSommChooser">
<header>
<div>
<span>Collection pairing</span>
<h3>Which cigar from {initialCollectionName||"this collection"} are you considering?</h3>
<p>A collection can contain fundamentally different cigars. {brand.name} will not blend their tasting identities. Confirm the exact cigar before analysis.</p>
</div>{collectionCandidates[0]&&<aside>
<strong>{collectionCandidates[0].evidence==="Readiness unknown"?"No defensible smoke-now leader yet":"Best-supported candidate right now"}</strong>
<span>As of {new Date().toLocaleDateString()}</span>
</aside>}</header>
<div>{collectionCandidates.map((candidate,index)=>
<article className={selectedId===candidate.item.inventoryId&&collectionChoiceConfirmed?"selected":""} key={candidate.item.inventoryId}>
<span>{index===0&&candidate.evidence!=="Readiness unknown"?"Current suggestion":candidate.evidence}</span>
<strong>{candidate.item.brand} {candidate.item.line}</strong>
<small>{candidate.item.vitola}{candidate.item.vintage?` · ${candidate.item.vintage}`:""}</small>
<p>{candidate.detail}</p>
<button type="button" onClick={()=>chooseCollectionCigar(candidate.item.inventoryId)}>{selectedId===candidate.item.inventoryId&&collectionChoiceConfirmed?"Confirmed":"Choose this cigar"}</button>
</article>)}</div>{!collectionCandidates.length&&<p className="emptyState">No available individual cigars are linked to this collection yet.</p>}</section>}<div className="sommSourceTabs" role="tablist" aria-label="Pairing direction">
<button type="button" role="tab" aria-selected={source==="inventory"} onClick={()=>chooseSource("inventory")}>My cigar → a pairing</button>
<button type="button" role="tab" aria-selected={source==="manual"} onClick={()=>chooseSource("manual")}>Another cigar → a pairing</button>
<button type="button" role="tab" aria-selected={source==="context"} onClick={()=>chooseSource("context")}>My moment → a cigar</button>
</div>
<form onSubmit={analyze}>{source==="inventory"?<>
<label className="sommCigarSearch">
<span>Find a cigar in your vault</span>
<input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search brand, line, vitola, or year"/>
</label>
<label className="sommCigarSelect">
<span>Choose the exact cigar *</span>
<select value={selectedId} onChange={event=>{setSelectedId(event.target.value);setCollectionChoiceConfirmed(true)}} required>
<option value="">Select from {available.length} owned lots</option>{selectOptions.map(item=>
<option value={item.inventoryId} key={item.inventoryId}>{identity(item)}</option>)}</select>
</label>{selected&&<article className="selectedCigar">
<div>
<span>Selected inventory cigar</span>
<strong>{selected.brand} {selected.line}</strong>
<small>{selected.vitola}{selected.vintage?` · ${selected.vintage}`:""} · {selected.currentQty??0} owned</small>
</div>
<b>{collectionChoiceRequired&&!collectionChoiceConfirmed?"Confirm this cigar above":"Ready to analyze"}</b>
</article>}</>:source==="manual"?<label className="manualCigar">
<span>Enter the cigar *</span>
<input value={manualName} onChange={event=>setManualName(event.target.value)} required minLength={3} maxLength={300} placeholder="Brand, line, vitola and year if known"/>
<small>Example: Arturo Fuente OpusX Lost City Double Robusto 2024</small>
</label>:<label className="manualCigar">
<span>What are you drinking, eating, or doing? *</span>
<textarea value={pairingContext} onChange={event=>setPairingContext(event.target.value)} required minLength={3} maxLength={500} rows={3} placeholder="I’m drinking coffee this morning—what cigar from my vault should I choose?"/>
<small>Try a meal, a specific drink, time of day, mood, celebration, or setting.</small>
</label>}<label>
<span>Occasion (optional)</span>
<input name="occasion" placeholder="After dinner, morning coffee, celebration…"/>
</label>
<label className="sommQuestion">
<span>Anything specific you want to know? (optional)</span>
<textarea value={question} onChange={event=>setQuestion(event.target.value)} maxLength={1000} rows={3} placeholder="Leave blank for a complete tasting and pairing analysis."/>
</label>
<label className="alcoholChoice">
<input name="includeAlcohol" type="checkbox" defaultChecked/>
<span>Include spirits and cocktails</span>
</label>
<button className="button" disabled={busy||!ready}>{busy?`Researching · ${elapsed}s`:source==="context"?"Find cigars for this moment":collectionChoiceRequired&&!collectionChoiceConfirmed?"Choose the exact collection cigar above":"Analyze cigar & pairings"}</button>{busy&&<output className="sommProgress" aria-live="polite">
<strong>{elapsed<15?"Understanding the cigar":elapsed<45?"Searching trusted sources":elapsed<75?"Building tasting and pairing guidance":"Finalizing your Cigar Somm profile"}</strong>
<span>Source-aware research normally takes 30–90 seconds. Keep this page open.</span>
</output>}</form>
<div className="sommPrompts">{prompts.map(prompt=>
<button type="button" onClick={()=>setQuestion(prompt)} key={prompt}>{prompt}</button>)}</div>{error&&<output className="sommError">{error}</output>}</section>
  {result&&<section className="sommAnswer">
<header>
<div>
<div className="eyebrow">Cigar Somm · AI-assisted · {result.confidence} confidence</div>
<h2>{cleanSommText(result.cigarContext)}</h2>
</div>
<span>AI-assisted · Source-aware</span>
</header>
{result.cigarRecommendations.length>0&&<section className="sommRecommendations">
<div className="eyebrow">From your vault</div>
<h3>Best cigars for this moment</h3>
{result.cigarRecommendations.map((recommendation,index)=><article key={recommendation.inventoryId}>
<span>{index===0?"First choice":`Alternative ${index+1}`}</span>
<strong>{cleanSommText(recommendation.cigarName)}</strong>
<p>{cleanSommText(recommendation.why)}</p>
<small>{cleanSommText(recommendation.serviceMoment)}</small>
</article>)}
</section>}
<div className="sommTake">
<strong>Cigar Somm’s take</strong>
<p className="sommLead">{sommLeadSummary(result.answer)}</p>
</div>
<aside className="sommPersonalization">
<div>
<strong>{result.personalization.used?"Personalized for your collection":"General guidance"}</strong>
<p>{cleanSommText(result.personalization.explanation)}</p>
</div>{result.personalization.signals.length>0&&<div className="sommSignals">{uniqueSommItems(result.personalization.signals).map(signal=>
<span key={signal}>{cleanSommText(signal)}</span>)}</div>}<small>Private account context is summarized for this answer and is never presented as a public source.</small>
</aside>
<section className="tastingProfile">
<div>
<span>Body</span>
<strong>{cleanSommText(result.tastingProfile.body)}</strong>
</div>
<div>
<span>Strength</span>
<strong>{cleanSommText(result.tastingProfile.strength)}</strong>
</div>
<article>
<span>Likely tasting notes</span>
<p>{result.tastingProfile.coreNotes.map(cleanSommText).join(" · ")}</p>
</article>
<article>
<span>Expected progression</span>{uniqueSommItems(result.tastingProfile.development).map(note=>
<p key={note}>{cleanSommText(note)}</p>)}</article>
<small>{cleanSommText(result.tastingProfile.evidence)}</small>
</section>
<div className="pairingGrid">
<Pairings title="Coffee" symbol="☕" items={result.coffee}/>
<Pairings title="Specific spirits" symbol="◒" items={result.spirits}/>
<Pairings title="Cocktails" symbol="◈" items={result.cocktails}/>
<Pairings title="Nonalcoholic" symbol="◇" items={result.nonAlcoholic}/>
</div>{result.spirits.length>0&&<p className="sommEditorialNote">Bottle recommendations are independent, source-verified editorial suggestions—not sponsorships or endorsements. Confirm local availability and current labeling.</p>}<div className="sommBasis">
<div>
<strong>Why these pairings work</strong>{uniqueSommItems(result.basis).map(value=>
<span key={value}>{cleanSommText(value)}</span>)}</div>
<div>
<strong>Boundaries</strong>{uniqueSommItems(result.cautions).map(value=>
<span key={value}>{cleanSommText(value)}</span>)}</div>
</div>
<div className="sommSources">
<div className="eyebrow">Research sources</div>{result.sources.length?result.sources.map(source=>
<a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
<strong>{source.title}</strong>
<span>{source.publisher} · {source.supports}</span>
</a>):<p>No external source was needed for this answer; recommendations use disclosed general pairing principles.</p>}</div>
</section>}
 </>;
}
function Pairings({title,symbol,items}:{title:string;symbol:string;items:CigarSommAnswer["coffee"]|CigarSommAnswer["spirits"]}){return <article>
<header>
<span>{symbol}</span>
<h3>{title}</h3>
</header>{items.map(item=>
<div key={`${item.name}-${item.style}`}>
<strong>{cleanSommText(item.name)}</strong>
<small>{cleanSommText(item.style)}</small>
<p>{cleanSommText(item.why)}</p>
<em>{cleanSommText(item.service)}</em>{"verificationUrl" in item&&<a href={item.verificationUrl} target="_blank" rel="noreferrer">Verify this label ↗</a>}</div>)}{!items.length&&<p className="small">Not included for this recommendation.</p>}</article>}
