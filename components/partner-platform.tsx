"use client";

import { FormEvent, useMemo, useState } from "react";

type Partner = { id:string;name:string;slug:string;partner_type:string;website_url?:string;contact_email?:string;status:"draft"|"active"|"paused"|"ended" };
type Campaign = { id:string;partner_id:string;name:string;code:string;channel:string;status:"draft"|"active"|"paused"|"ended";attribution_window_days:number;commission_type:"percentage"|"fixed";commission_rate:number;hold_days:number;partners?:{name?:string} };
type Commission = { id:string;partner_id:string;campaign_id:string;amount_cents:number;status:"pending"|"approved"|"void"|"paid";available_at:string };
type Payout = { id:string;partner_id:string;period_start:string;period_end:string;amount_cents:number;currency:string;status:"draft"|"approved"|"processing"|"paid"|"failed"|"void";payment_reference?:string;paid_at?:string };
type PartnerData = {
  partners:Partner[];campaigns:Campaign[];commissions:Commission[];payouts:Payout[];
  summary:{activePartners:number;activeCampaigns:number;clicks:number;attributedCollectors:number;paidConversions:number;netRevenueCents:number;pendingCommissionCents:number;approvedCommissionCents:number};
};

const money=(cents:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
const publicOrigin=()=>typeof window==="undefined"?"":window.location.origin;

export function PartnerPlatform(){
  const[key,setKey]=useState("");const[data,setData]=useState<PartnerData>();const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
  const activePartners=useMemo(()=>data?.partners.filter(partner=>partner.status!=="ended")||[],[data]);
  async function request(body?:unknown){
    const response=await fetch("/api/partners",{method:body?"POST":"GET",headers:{"x-founder-key":key,...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store"});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"Partner operation failed");return result.data;
  }
  async function load(event?:FormEvent<HTMLFormElement>){event?.preventDefault();setBusy(true);setMessage("");try{setData(await request())}catch(error){setMessage(error instanceof Error?error.message:"Unable to open partner platform")}finally{setBusy(false)}}
  async function createPartner(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);try{await request({action:"createPartner",data:Object.fromEntries(form)});event.currentTarget.reset();await load();setMessage("Partner created as a draft. Review the agreement before activation.")}catch(error){setMessage(error instanceof Error?error.message:"Unable to create partner")}finally{setBusy(false)}}
  async function createCampaign(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);try{await request({action:"createCampaign",data:Object.fromEntries(form)});event.currentTarget.reset();await load();setMessage("Campaign created as a draft. Test its referral path before activation.")}catch(error){setMessage(error instanceof Error?error.message:"Unable to create campaign")}finally{setBusy(false)}}
  async function setStatus(entity:"partner"|"campaign"|"commission",id:string,status:string){setBusy(true);try{await request({action:"setStatus",entity,id,status});await load();setMessage(`${entity[0].toUpperCase()+entity.slice(1)} updated.`)}catch(error){setMessage(error instanceof Error?error.message:"Unable to update status")}finally{setBusy(false)}}
  async function createPayout(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);try{await request({action:"createPayout",partnerId:form.get("partnerId"),periodStart:form.get("periodStart"),periodEnd:form.get("periodEnd"),paymentReference:form.get("paymentReference")});event.currentTarget.reset();await load();setMessage("Payout statement created from approved, available commissions.")}catch(error){setMessage(error instanceof Error?error.message:"Unable to create payout")}finally{setBusy(false)}}
  async function markPayoutPaid(item:Payout){const reference=window.prompt("Enter the ACH, check, or payment confirmation reference:",item.payment_reference||"");if(!reference)return;setBusy(true);try{await request({action:"markPayoutPaid",id:item.id,paymentReference:reference});await load();setMessage("Payout and its linked commissions are now recorded as paid.")}catch(error){setMessage(error instanceof Error?error.message:"Unable to mark payout paid")}finally{setBusy(false)}}
  async function copyLink(code:string){await navigator.clipboard.writeText(`${publicOrigin()}/r/${code}`);setMessage("Referral link copied.")}
  if(!data)return <section className="card partnerGate"><div><div className="eyebrow">Founder access</div><h2>Open the Partner Network</h2><p>Commercial terms and conversion totals are protected by the Cedriva founder key.</p></div><form onSubmit={load}><label><span>Founder write key</span><input value={key} onChange={event=>setKey(event.target.value)} type="password" required/></label><button className="button" disabled={busy}>{busy?"Opening…":"Open platform"}</button></form>{message&&<output>{message}</output>}</section>;
  return <>{message&&<output className="partnerMessage">{message}</output>}
    <section className="partnerMetrics">
      <article><span>Active partners</span><strong>{data.summary.activePartners}</strong><small>{data.partners.length} total records</small></article>
      <article><span>Campaigns</span><strong>{data.summary.activeCampaigns}</strong><small>{data.summary.clicks} tracked visits</small></article>
      <article><span>Attributed collectors</span><strong>{data.summary.attributedCollectors}</strong><small>{data.summary.paidConversions} paid conversions</small></article>
      <article><span>Net attributed revenue</span><strong>{money(data.summary.netRevenueCents)}</strong><small>confirmed revenue</small></article>
      <article><span>Commission liability</span><strong>{money(data.summary.pendingCommissionCents+data.summary.approvedCommissionCents)}</strong><small>pending and approved</small></article>
    </section>
    <section className="partnerWorkspace">
      <div className="partnerDirectory">
        <div className="sectionHead"><div><div className="eyebrow">Reusable partner records</div><h2>Partners and campaigns</h2></div></div>
        {data.partners.map(partner=><article className="partnerCard" key={partner.id}><header><div><small>{partner.partner_type} · {partner.status}</small><h3>{partner.name}</h3>{partner.contact_email&&<span>{partner.contact_email}</span>}</div><select value={partner.status} disabled={busy} onChange={event=>setStatus("partner",partner.id,event.target.value)}><option>draft</option><option>active</option><option>paused</option><option>ended</option></select></header><div className="campaignList">{data.campaigns.filter(campaign=>campaign.partner_id===partner.id).map(campaign=><div key={campaign.id}><span><strong>{campaign.name}</strong><small>{campaign.channel} · {campaign.attribution_window_days}-day attribution · {campaign.commission_type==="percentage"?`${campaign.commission_rate}%`:`${money(campaign.commission_rate)}`} · {campaign.hold_days}-day hold</small></span><code>/r/{campaign.code}</code><button className="button secondary" onClick={()=>copyLink(campaign.code)}>Copy link</button><select value={campaign.status} disabled={busy} onChange={event=>setStatus("campaign",campaign.id,event.target.value)}><option>draft</option><option>active</option><option>paused</option><option>ended</option></select></div>)}</div></article>)}
        {!data.partners.length&&<div className="emptyState">Create the first partner record. The same structure will support retailers, lounges, manufacturers, media, and creators.</div>}
      </div>
      <aside className="partnerForms">
        <section className="card"><div className="eyebrow">Partner setup</div><h2>Add a partner</h2><form onSubmit={createPartner}>
          <label><span>Organization</span><input name="name" required/></label><label><span>Partner slug</span><input name="slug" placeholder="fox-cigars" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/></label>
          <label><span>Partner type</span><select name="partnerType"><option value="retailer">Retailer</option><option value="lounge">Lounge</option><option value="manufacturer">Manufacturer</option><option value="creator">Creator</option><option value="media">Media</option><option value="industry">Industry partner</option><option value="other">Other</option></select></label>
          <label><span>Website</span><input name="websiteUrl" type="url" placeholder="https://"/></label><label><span>Contact name</span><input name="contactName"/></label><label><span>Contact email</span><input name="contactEmail" type="email"/></label>
          <label><span>Required disclosure</span><textarea name="disclosureText" rows={3} defaultValue="This partner may receive compensation for eligible paid Cedriva memberships." required/></label><label><span>Internal notes</span><textarea name="notes" rows={3}/></label><button className="button" disabled={busy}>Create draft partner</button>
        </form></section>
        <section className="card"><div className="eyebrow">Attribution setup</div><h2>Add a campaign</h2><form onSubmit={createCampaign}>
          <label><span>Partner</span><select name="partnerId" required><option value="">Select partner</option>{activePartners.map(partner=><option value={partner.id} key={partner.id}>{partner.name}</option>)}</select></label>
          <label><span>Campaign name</span><input name="name" placeholder="Founding newsletter" required/></label><label><span>Referral code</span><input name="code" placeholder="fox-founding-launch" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/></label>
          <label><span>Channel</span><select name="channel"><option value="email">Email</option><option value="website">Website</option><option value="social">Social</option><option value="event">Event</option><option value="qr">QR code</option><option value="creator">Creator</option><option value="other">Other</option></select></label>
          <input name="destinationPath" type="hidden" value="/partners/join"/><div className="formPair"><label><span>Attribution days</span><input name="attributionWindowDays" type="number" min="1" max="365" defaultValue="30"/></label><label><span>Hold days</span><input name="holdDays" type="number" min="0" max="180" defaultValue="30"/></label></div>
          <div className="formPair"><label><span>Commission</span><select name="commissionType"><option value="percentage">Percentage</option><option value="fixed">Fixed cents</option></select></label><label><span>Rate</span><input name="commissionRate" type="number" min="0" step=".01" defaultValue="20"/></label></div>
          <button className="button" disabled={busy}>Create draft campaign</button>
        </form></section>
      </aside>
    </section>
    <section className="card commissionLedger"><div className="sectionHead"><div><div className="eyebrow">Commission ledger</div><h2>From earned to paid</h2><p>Revenue appears only after a confirmed payment. The hold period protects both Cedriva and the partner from refunds and chargebacks.</p></div></div>
      {data.commissions.map(item=><article key={item.id}><span><strong>{money(item.amount_cents)}</strong><small>Available {new Date(item.available_at).toLocaleDateString()}</small></span><em>{item.status}</em><div>{item.status==="pending"&&new Date(item.available_at)<=new Date()&&<button className="button secondary" onClick={()=>setStatus("commission",item.id,"approved")}>Approve</button>}{item.status==="approved"&&<button className="button secondary" onClick={()=>setStatus("commission",item.id,"paid")}>Mark paid</button>}</div></article>)}
      {!data.commissions.length&&<div className="emptyState">Confirmed partner payments will create an auditable commission record here.</div>}
    </section>
    <section className="payoutWorkspace">
      <div className="card payoutLedger"><div className="sectionHead"><div><div className="eyebrow">Partner statements</div><h2>Payout history</h2></div></div>{data.payouts.map(item=><article key={item.id}><span><strong>{money(item.amount_cents)}</strong><small>{new Date(item.period_start).toLocaleDateString()}–{new Date(item.period_end).toLocaleDateString()} · {item.status}</small></span><span>{item.payment_reference||"Reference added when paid"}</span>{item.status==="approved"&&<button className="button secondary" onClick={()=>markPayoutPaid(item)}>Record payment</button>}</article>)}{!data.payouts.length&&<div className="emptyState">Approved commissions can be grouped into a clear monthly partner statement.</div>}</div>
      <aside className="card"><div className="eyebrow">Monthly close</div><h2>Create payout statement</h2><form onSubmit={createPayout}><label><span>Partner</span><select name="partnerId" required><option value="">Select partner</option>{activePartners.map(partner=><option value={partner.id} key={partner.id}>{partner.name}</option>)}</select></label><div className="formPair"><label><span>Period start</span><input name="periodStart" type="date" required/></label><label><span>Period end</span><input name="periodEnd" type="date" required/></label></div><label><span>Optional reference</span><input name="paymentReference" placeholder="July 2026 statement"/></label><button className="button" disabled={busy}>Create statement</button></form></aside>
    </section>
  </>;
}
