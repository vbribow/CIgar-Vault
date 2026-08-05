"use client";

import { useState, type FormEvent } from "react";
import { placeVibes } from "@/lib/places";
import { RatingLeafMark } from "@/components/rating-leaf-mark";

const scoreChoices=[
  {score:60,label:"Not for me"},
  {score:72,label:"Fair"},
  {score:82,label:"Good"},
  {score:91,label:"Great"},
  {score:97,label:"Exceptional"},
] as const;

export function QuickPlaceRating({googlePlaceId,name,onSuccess}:{googlePlaceId:string;name:string;onSuccess?:()=>void}){
 const[score,setScore]=useState<number>();
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState("");
 const[needsSignIn,setNeedsSignIn]=useState(false);
 const[selectedVibes,setSelectedVibes]=useState<string[]>([]);
 const today=new Date().toISOString().slice(0,10);
 const returnTo=typeof window==="undefined"?"/places":window.location.pathname+window.location.search;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!score){setMessage("Choose the experience that best fits your visit.");return}
  const form=new FormData(event.currentTarget);
  setBusy(true);setMessage("");setNeedsSignIn(false);
  try{
   const response=await fetch("/api/places/reviews",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
    googlePlaceId,
    displayName:String(form.get("displayName")),
    score,
    visitDate:String(form.get("visitDate")||today),
    vibes:form.getAll("vibes").slice(0,3),
    capabilities:[],
    review:String(form.get("review")||""),
   })});
   const result=await response.json();
   if(response.status===401){setNeedsSignIn(true);throw new Error("Sign in to finish your rating.")}
   if(!response.ok)throw new Error(result.error||"Rating could not be submitted");
   setMessage("Thank you—your visit now helps the collector community.");
   event.currentTarget.reset();setScore(undefined);setSelectedVibes([]);onSuccess?.();
  }catch(error){setMessage(error instanceof Error?error.message:"Rating could not be submitted")}finally{setBusy(false)}
 }
 return <form className="quickPlaceRating card" onSubmit={submit}>
  <div><div className="eyebrow">30-second lounge rating</div><h2>{name}</h2><p>Rate the experience honestly. Partner lounges never receive rewards for positive scores.</p></div>
  <label><span>Your public name</span><input name="displayName" autoComplete="name" required minLength={2}/></label>
  <fieldset className="experienceChoices"><legend>How was your visit?</legend>{scoreChoices.map(choice=><button key={choice.score} type="button" className={score===choice.score?"active":""} aria-pressed={score===choice.score} onClick={()=>setScore(choice.score)}><RatingLeafMark value={choice.score} label={choice.label} compact/></button>)}</fieldset>
  <details><summary>Add atmosphere tags or a note <span>Optional</span></summary><fieldset className="quickVibes"><legend>Choose up to three</legend>{placeVibes.map(vibe=><label key={vibe}><input type="checkbox" name="vibes" value={vibe} checked={selectedVibes.includes(vibe)} disabled={selectedVibes.length>=3&&!selectedVibes.includes(vibe)} onChange={event=>setSelectedVibes(current=>event.target.checked?[...current,vibe]:current.filter(value=>value!==vibe))}/>{vibe}</label>)}</fieldset><label><span>Short note</span><textarea name="review" maxLength={500} rows={3} placeholder="What stood out?"/></label><label><span>Visit date</span><input name="visitDate" type="date" defaultValue={today}/></label></details>
  {message&&<output>{message}{needsSignIn&&<a href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in →</a>}</output>}
  <button className="button" disabled={busy||!score}>{busy?"Submitting…":"Submit rating"}</button>
  <small>One current rating per collector and lounge. Your newest rating replaces your prior one.</small>
 </form>;
}
