"use client";

import { useEffect, useState } from "react";

type Preview={partnerName:string;partnerSlug:string;displayName:string;role:string;expiresAt:string};

export function PartnerInvitation({token}:{token:string}){
  const[data,setData]=useState<Preview>();const[error,setError]=useState("");const[busy,setBusy]=useState(false);const[accepted,setAccepted]=useState(false);
  useEffect(()=>{fetch(`/api/partner-invitations?token=${encodeURIComponent(token)}`,{cache:"no-store"}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);setData(result.data)}).catch(reason=>setError(reason instanceof Error?reason.message:"Invitation unavailable"))},[token]);
  async function accept(){setBusy(true);setError("");try{const response=await fetch("/api/partner-invitations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});const result=await response.json();if(response.status===401){window.location.href=`/login?next=${encodeURIComponent(`/partners/invite/${token}`)}`;return}if(!response.ok)throw new Error(result.error);setAccepted(true)}catch(reason){setError(reason instanceof Error?reason.message:"Unable to accept invitation")}finally{setBusy(false)}}
  if(error)return <div className="invitationState error"><h2>Invitation unavailable</h2><p>{error}</p><a className="button secondary" href="/">Return to Cedriva</a></div>;
  if(!data)return <div className="invitationState"><h2>Verifying invitation…</h2><p>Cedriva is confirming the organization, role, and expiration.</p></div>;
  if(accepted)return <div className="invitationState success"><div className="eyebrow">Workspace access confirmed</div><h2>Welcome to {data.partnerName}</h2><p>Your {data.role} access is active. The founder retains exclusive campaign approval, launch, and emergency controls.</p><a className="button" href="/partner-workspace">Open partner workspace</a></div>;
  return <div className="invitationState"><div className="eyebrow">Secure organization invitation</div><h2>Join {data.partnerName}</h2><p><strong>{data.displayName}</strong>, you have been invited as <strong>{data.role}</strong>.</p><ul><li>Access is limited to this organization.</li><li>Private collector identities and collections are never shared.</li><li>Partners cannot approve, launch, or pause campaigns.</li></ul><small>Invitation expires {new Date(data.expiresAt).toLocaleString()}.</small><button className="button" disabled={busy} onClick={accept}>{busy?"Confirming…":"Accept secure invitation"}</button><a className="textLink" href={`/login?next=${encodeURIComponent(`/partners/invite/${token}`)}`}>Sign in with the invited email →</a></div>;
}
