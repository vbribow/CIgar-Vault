"use client";

import { useState, type FormEvent } from "react";
import { QuickPlaceRating } from "@/components/quick-place-rating";
import { brand } from "@/lib/brand";
import { certificationDisplayLabels, certificationLevels, communityPlaceRankingScore, type GooglePlaceResult, type PlaceCertification } from "@/lib/places";

type Result=GooglePlaceResult&{
 cedrivaScore?:number;
 cedrivaReviewCount:number;
 cedrivaScoreStatus:"Established"|"Developing";
 vibes:Array<{vibe:string;count:number}>;
 certification?:PlaceCertification;
};

export function PlaceDirectory(){
 const[zip,setZip]=useState("");
 const[results,setResults]=useState<Result[]>([]);
 const[selected,setSelected]=useState<Result>();
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState("");
 const[meta,setMeta]=useState<{retrievedAt:string;methodology:string}>();

 async function search(event:FormEvent){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await fetch(`/api/places/search?zip=${encodeURIComponent(zip)}`,{cache:"no-store"});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||"Search failed");
   setResults(body.data);setMeta(body.meta);
   if(!body.data.length)setMessage("No verified matches found. Try a nearby ZIP code.");
  }catch(error){setMessage(error instanceof Error?error.message:"Search failed")}finally{setBusy(false)}
 }
 async function certify(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!selected)return;
  const form=new FormData(event.currentTarget);
  const body={googlePlaceId:selected.googlePlaceId,level:String(form.get("level")),score:Number(form.get("score")),visitMonth:String(form.get("visitMonth")),summary:String(form.get("summary")),strengths:String(form.get("strengths")),opportunities:String(form.get("opportunities")||"")||undefined,complimentaryDisclosure:String(form.get("complimentaryDisclosure")||"")||undefined,nextReviewDate:String(form.get("nextReviewDate"))};
  setBusy(true);
  try{
   const response=await fetch("/api/places/certifications",{method:"POST",headers:{"content-type":"application/json","x-founder-key":String(form.get("writeKey")||"")},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error);
   setMessage("Independent location assessment saved.");setSelected(undefined);
  }catch(error){setMessage(error instanceof Error?error.message:"Assessment failed")}finally{setBusy(false)}
 }

 return <>
  <section className="placeSearch card">
   <div><div className="eyebrow">Top lounges near you</div><h2>Find a room worth visiting.</h2><p>Search nearby cigar lounges and retailers. {brand.name} community ratings stay separate from Google reviews.</p></div>
   <form onSubmit={search}><label><span>U.S. ZIP code</span><input value={zip} onChange={event=>setZip(event.target.value)} inputMode="numeric" pattern="\d{5}(-\d{4})?" placeholder="90210" required/></label><button className="button" disabled={busy}>{busy?"Searching…":"Find lounges"}</button></form>
  </section>
  {message&&<output className="placeMessage">{message}</output>}
  {meta&&<aside className="placeMethod"><strong>Community-first ranking</strong><span>{meta.methodology}</span><small>Google data retrieved {new Date(meta.retrievedAt).toLocaleString()} · Google ratings are never converted into {brand.name} ratings.</small></aside>}
  {results.length>0&&<div className="placeResultsHeading"><div><div className="eyebrow">Nearby results</div><h2>{results.some(place=>place.cedrivaReviewCount>=5)?"Top community-rated lounges":"A ranking taking shape"}</h2></div><p>Five unique {brand.name} ratings are required before a lounge is ranked as established.</p></div>}
  <section className="placeResults">{results.map((place,index)=>{
   const rankingScore=communityPlaceRankingScore(place.cedrivaScore,place.cedrivaReviewCount);
   return <article key={place.googlePlaceId}>
    <header><span>{place.cedrivaReviewCount>=5?`#${index+1} community ranked`:"Community score developing"}</span>{place.certification&&<b>{certificationDisplayLabels[place.certification.level]}</b>}</header>
    <h2>{place.name}</h2><p>{place.address}</p>
    <div className="dualScores">
     <div><span>Google rating</span><strong>{place.googleRating??"—"}</strong><small>{place.googleReviewCount??0} Google reviews</small></div>
     <div><span>{brand.name} Community</span><strong>{place.cedrivaScore??"—"}</strong><small>{place.cedrivaReviewCount} visit rating{place.cedrivaReviewCount===1?"":"s"} · {place.cedrivaScoreStatus}</small></div>
     {rankingScore!==undefined&&<div><span>Confidence score</span><strong>{rankingScore}</strong><small>Sample-size adjusted</small></div>}
     {place.certification&&<div><span>Independent critic</span><strong>{place.certification.score}</strong><small>{place.certification.visitMonth}</small></div>}
    </div>
    {place.vibes.length>0&&<div className="placeVibes">{place.vibes.map(value=><span key={value.vibe}>{value.vibe} · {value.count}</span>)}</div>}
    {place.certification&&<blockquote>{place.certification.summary}</blockquote>}
    <footer><a href={place.googleMapsUri} target="_blank" rel="noreferrer">Google Maps ↗</a>{place.websiteUri&&<a href={place.websiteUri} target="_blank" rel="noreferrer">Website ↗</a>}<button className="button" onClick={()=>setSelected(place)}>Rate this lounge</button></footer>
   </article>;
  })}</section>
  {selected&&<section className="placeContribution">
   <header><div><div className="eyebrow">{brand.name} Lounge Passport</div><h2>Document this visit</h2></div><button onClick={()=>setSelected(undefined)}>Close</button></header>
   <div className="placeContributionForms">
    <QuickPlaceRating googlePlaceId={selected.googlePlaceId} name={selected.name} onSuccess={()=>setMessage("Thank you—your lounge rating was submitted.")}/>
    <details className="founderCertification"><summary>Founder-only independent assessment</summary><form className="card" onSubmit={certify}><p>The assessment cannot be purchased and remains separate from community ratings.</p><label><span>Designation</span><select name="level">{certificationLevels.map(value=><option key={value} value={value}>{certificationDisplayLabels[value]}</option>)}</select></label><label><span>Critic score</span><input name="score" type="number" min="1" max="100" required/></label><label><span>Visit month</span><input name="visitMonth" type="month" required/></label><label><span>Assessment</span><textarea name="summary" minLength={40} rows={5} required/></label><label><span>Strengths</span><textarea name="strengths" minLength={10} rows={3} required/></label><label><span>Opportunities</span><textarea name="opportunities" rows={3}/></label><label><span>Complimentary items / relationship</span><input name="complimentaryDisclosure"/></label><label><span>Next review</span><input name="nextReviewDate" type="date" required/></label><label><span>Founder write key</span><input name="writeKey" type="password" required/></label><button className="button" disabled={busy}>Save independent assessment</button></form></details>
   </div>
  </section>}
 </>;
}
