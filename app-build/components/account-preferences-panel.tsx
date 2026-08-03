"use client";
import { useRef, useState, type FormEvent } from "react";
import type { AccountPreferences } from "@/lib/account-preferences";
import { AppUpdatePanel } from "@/components/app-update-panel";

const options:[keyof AccountPreferences,string,string][]=[
  ["emailNotifications","Email delivery","Allow the platform to send account alerts by email when delivery is configured."],
  ["wishlistAlerts","Wishlist price alerts","Email me when monitored listings meet a target price."],
  ["valuationResearch","Valuation research","Periodically research stale or missing replacement values."],
  ["ratingResearch","Professional rating research","Periodically look for sourced published ratings."],
  ["productAnalytics","Private product analytics","Share privacy-safe feature events without inventory details or identity."],
  ["upgradeRecommendations","Membership recommendations","Show discreet plan suggestions based on features I use."],
];
export function AccountPreferencesPanel({initial}:{initial:AccountPreferences}){
  const[values,setValues]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState("");const saveInFlight=useRef(false);
  async function submit(event:FormEvent){
    event.preventDefault();
    if(saveInFlight.current)return;saveInFlight.current=true;setBusy(true);
    setMessage("");
    try{const response=await fetch("/api/account/preferences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});const result=await response.json().catch(()=>({}));setMessage(response.ok?"Preferences saved across your devices.":result.error||"Unable to save preferences.")}catch(error){setMessage(error instanceof Error?error.message:"Unable to save preferences. Check your connection and try again.")}finally{saveInFlight.current=false;setBusy(false)}
  }
  return <>
    <form className="card preferencesCard" onSubmit={submit}>
      <div><div className="eyebrow">Control center</div><h2>Privacy & notifications</h2><p>Choose how the platform works for you. Inventory records remain private regardless of these settings.</p></div>
      <div className="preferenceList">{options.map(([key,title,detail])=><label className="preferenceRow" key={key}><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" checked={values[key]} onChange={event=>setValues(current=>({...current,[key]:event.target.checked}))}/></label>)}</div>
      <div className="preferenceFooter"><button className="button" disabled={busy}>{busy?"Saving…":"Save preferences"}</button>{message&&<output>{message}</output>}</div>
    </form>
    <section className="card dataRequestCard">
      <div><div className="eyebrow">Privacy controls</div><h2>Account data requests</h2><p>Request access to, correction of, or deletion of account data through a signed-in, auditable channel. A deletion request starts identity, scope, export, retention, and irreversible-effects review; it does not immediately delete anything.</p></div>
      <div className="dataRequestActions"><a className="button secondary" href="/feedback?request=access">Request access</a><a className="button secondary" href="/feedback?request=correction">Request correction</a><a className="textLink destructiveLink" href="/feedback?request=deletion">Request deletion →</a></div>
    </section>
    <AppUpdatePanel/>
  </>;
}
