"use client";
import { useState, type FormEvent } from "react";
import type { AccountPreferences } from "@/lib/account-preferences";

const options:[keyof AccountPreferences,string,string][]=[
  ["emailNotifications","Email delivery","Allow Cigar Vault to send account alerts by email when delivery is configured."],
  ["wishlistAlerts","Wishlist price alerts","Email me when monitored listings meet a target price."],
  ["valuationResearch","Valuation research","Periodically research stale or missing replacement values."],
  ["ratingResearch","Professional rating research","Periodically look for sourced published ratings."],
  ["productAnalytics","Private product analytics","Share privacy-safe feature events without inventory details or identity."],
  ["upgradeRecommendations","Membership recommendations","Show discreet plan suggestions based on features I use."],
];
export function AccountPreferencesPanel({initial}:{initial:AccountPreferences}){const[values,setValues]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState("");async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");const response=await fetch("/api/account/preferences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});const result=await response.json();setBusy(false);setMessage(response.ok?"Preferences saved across your devices.":result.error||"Unable to save preferences.")}return <form className="card preferencesCard" onSubmit={submit}><div><div className="eyebrow">Control center</div><h2>Privacy & notifications</h2><p>Choose how Cigar Vault works for you. Inventory records remain private regardless of these settings.</p></div><div className="preferenceList">{options.map(([key,title,detail])=><label className="preferenceRow" key={key}><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" checked={values[key]} onChange={event=>setValues(current=>({...current,[key]:event.target.checked}))}/></label>)}</div><div className="preferenceFooter"><button className="button" disabled={busy}>{busy?"Saving…":"Save preferences"}</button>{message&&<output>{message}</output>}</div></form>}
