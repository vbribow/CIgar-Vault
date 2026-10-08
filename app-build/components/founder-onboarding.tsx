"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  betaInvitationEmail,
  betaInvitationWebmailLinks,
  betaConfirmationRecoveryUrl,
  betaDeviceAcceptanceSteps,
  betaNextAction,
  betaProgressSteps,
  betaStageLabel,
  betaSummary,
  type BetaCollector,
  type BetaStage,
} from "@/lib/beta-onboarding";
import { createClientUuid } from "@/lib/client-uuid";
import { FounderBetaFeedback } from "@/components/founder-beta-feedback";
import { forgetFounderSessionKey, readFounderSessionKey, rememberFounderSessionKey } from "@/lib/founder-session";
import { FOUNDER_BETA_SEAT_LIMIT } from "@/lib/beta-cohort";

const stages: BetaStage[] = ["Prospect", "Invited", "Signed up", "Imported", "Activated"];
type Readiness = { ready:boolean; readyCount:number; totalGates:number; invited:number; signedUp:number; consented:number; backedUp:number; openFeedback:number; criticalFeedback:number; gates:Array<{key:string;label:string;ready:boolean;detail:string}> };
type InvitationResult = { kind:"submitted"; delivered:boolean; status:string; providerId:string } | { kind:"prepared" } | { kind:"cancelled" };

export function FounderOnboarding() {
  const [key, setKey] = useState("");
  const [items, setItems] = useState<BetaCollector[]>();
  const [readiness, setReadiness] = useState<Readiness>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<BetaCollector>();
  const [copied, setCopied] = useState(false);
  const summary = useMemo(() => betaSummary(items || []), [items]);
  const preparedEmail = prepared ? betaInvitationEmail(prepared) : undefined;
  const webmailLinks = prepared ? betaInvitationWebmailLinks(prepared) : undefined;

  async function fetchItems(next = key) {
    const response = await fetch("/api/founder-onboarding", { headers: { "x-founder-key": next } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setItems(result.data);
  }

  async function fetchReadiness(next = key) {
    const response = await fetch("/api/beta-readiness", { headers: { "x-founder-key": next } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setReadiness(result.data);
  }

  async function synchronize(next = key) {
    const response = await fetch("/api/founder-onboarding/sync", { method: "POST", headers: { "x-founder-key": next } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data as { matched:number; advanced:number };
  }

  async function openSession(next: string) {
    const result = await synchronize(next);
    await Promise.all([fetchItems(next), fetchReadiness(next)]);
    setKey(next);
    rememberFounderSessionKey(next);
    return result;
  }

  useEffect(() => {
    const saved = readFounderSessionKey();
    if (!saved) return;
    setBusy(true);
    void openSession(saved)
      .then(result => setMessage(`Progress refreshed automatically · ${result.matched} accounts matched · ${result.advanced} stages advanced.`))
      .catch(error => {
        forgetFounderSessionKey();
        setMessage(error instanceof Error ? error.message : "Unable to open queue");
      })
      .finally(() => setBusy(false));
  }, []);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const next = String(new FormData(event.currentTarget).get("writeKey") || "");
    try {
      const result = await openSession(next);
      setMessage(`Progress refreshed automatically · ${result.matched} accounts matched · ${result.advanced} stages advanced.`);
    } catch (error) {
      forgetFounderSessionKey();
      setMessage(error instanceof Error ? error.message : "Unable to open queue");
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    setMessage("");
    try {
      const result = await synchronize();
      await Promise.all([fetchItems(), fetchReadiness()]);
      setMessage(`${result.matched} accounts matched · ${result.advanced} stages advanced.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to synchronize onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function sendInvitation(item: BetaCollector, confirmSend = true): Promise<InvitationResult> {
    if (confirmSend && !window.confirm(`Send the private beta invitation to ${item.email}?`)) return { kind:"cancelled" };
    const response = await fetch("/api/founder-onboarding/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-founder-key": key },
      body: JSON.stringify({ collectorId:item.id, action:"send", submissionId:createClientUuid() }),
    });
    const result = await response.json();
    if (!response.ok && response.status === 503 && result.code === "EMAIL_PROVIDER_NOT_CONFIGURED") {
      setPrepared(item);
      setCopied(false);
      return { kind:"prepared" };
    }
    if (!response.ok) throw new Error(result.error || "Unable to send invitation");
    setItems(current => (current || []).map(value => value.id === item.id ? { ...value, ...result.data.collector, progress:value.progress } : value));
    return {
      kind:"submitted",
      delivered:Boolean(result.data.delivered),
      status:String(result.data.status || "submitted"),
      providerId:String(result.data.providerId || "submitted"),
    };
  }

  async function checkInvitation(item: BetaCollector) {
    setBusy(true);
    setMessage(`Checking delivery to ${item.email}…`);
    try {
      const response = await fetch("/api/founder-onboarding/invite", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-founder-key":key },
        body:JSON.stringify({ collectorId:item.id, action:"status" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to check invitation delivery");
      setItems(current => (current || []).map(value => value.id === item.id ? { ...value, ...result.data.collector, progress:value.progress } : value));
      setMessage(result.data.delivered
        ? `Delivery confirmed for ${item.email}.`
        : `Delivery is not confirmed for ${item.email}. Current provider status: ${result.data.status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check invitation delivery");
    } finally {
      setBusy(false);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const submissionId = createClientUuid();
    if (!window.confirm(`Add ${name} and send the private beta invitation to ${email}?`)) return;
    setBusy(true);
    setMessage("Adding tester…");
    try {
      const response = await fetch("/api/founder-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-founder-key": key },
        body: JSON.stringify({ name, email, stage:"Prospect", notes:form.get("notes"), sendInvitation:true, submissionId }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.recoverable && result.data) {
          const collector = result.data as BetaCollector;
          setItems(current => [collector, ...(current || []).filter(item => item.id !== collector.id)]);
          event.currentTarget.reset();
          if (result.recovery === "manual-email") {
            setPrepared(collector);
            setCopied(false);
            setMessage(`${result.error || "Automatic delivery was not accepted"} No invitation access was enabled. The Gmail backup is ready below; send it, then confirm the manual send.`);
          } else {
            setMessage(`${result.error || "The invitation requires a status retry."} Provider reference ${result.providerId || "retained"}.`);
          }
          return;
        }
        throw new Error(result.error || "Unable to add and invite tester");
      }
      const collector = result.data as BetaCollector;
      setItems(current => [collector, ...(current || [])]);
      event.currentTarget.reset();
      setMessage(result.delivery.delivered
        ? `Delivery confirmed for ${collector.email}.`
        : `Invitation submitted for ${collector.email} · provider reference ${result.delivery.providerId}. Delivery is not yet confirmed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add tester");
    } finally {
      setBusy(false);
    }
  }

  async function update(item: BetaCollector, stage: BetaStage) {
    setBusy(true);
    setMessage("Saving stage…");
    try {
      const response = await fetch("/api/founder-onboarding", {
        method:"PATCH",
        headers: { "Content-Type":"application/json", "x-founder-key":key },
        body: JSON.stringify({ ...item, stage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setItems(current => (current || []).map(value => value.id === item.id ? { ...result.data, progress:item.progress } : value));
      await fetchReadiness();
      setMessage(`${item.name} is now ${betaStageLabel(stage)}.`);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update collector stage");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function prepare(item: BetaCollector) {
    setPrepared(item);
    setCopied(false);
    setMessage(item.stage === "Prospect" ? `Gmail backup prepared for ${item.name}. Sending it does not enable access until you confirm the manual send.` : `Invitation copy prepared for ${item.name}.`);
  }

  async function confirmManualInvitation() {
    if (!prepared || prepared.stage !== "Prospect") return;
    if (!window.confirm(`Confirm that you sent the Gmail invitation to ${prepared.email} and enable their beta access?`)) return;
    const updated = await update(prepared, "Invited");
    if (!updated) return;
    setPrepared({ ...prepared, stage:"Invited" });
    setMessage(`Manual invitation recorded for ${prepared.email}. Their beta signup access is now enabled.`);
  }

  async function copyInvitation() {
    if (!preparedEmail) return;
    const text = `To: ${preparedEmail.recipient}\nSubject: ${preparedEmail.subject}\n\n${preparedEmail.body}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const succeeded = document.execCommand("copy");
      field.remove();
      if (!succeeded) { setMessage("Copy was blocked. Select the invitation text below and copy it manually."); return; }
    }
    setCopied(true);
    setMessage("Invitation copied. Paste it into your email and send when ready.");
  }

  async function sendReinstall(item: BetaCollector) {
    if (!window.confirm(`Submit the approved Hojavía app-update notice to ${item.email}?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/founder-onboarding/reinstall-notice", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-founder-key":key },
        body:JSON.stringify({ collectorId:item.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setItems(current => (current || []).map(value => value.id === item.id ? { ...value, lastContactAt:result.data.acceptedAt, updatedAt:result.data.acceptedAt } : value));
      setMessage(`The email provider accepted the app-update notice for ${result.data.recipient}; delivery is not yet confirmed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit the reinstall notice");
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <section className="card betaGate"><div><div className="eyebrow">Founder access</div><h2>Open beta invitations</h2><p>Protected by the same Founder key used for private operations. Tester progress refreshes automatically after access is confirmed.</p></div><form onSubmit={unlock}><label><span>Founder write key</span><input name="writeKey" type="password" required/></label><button className="button" disabled={busy}>{busy ? "Refreshing progress…" : "Open invitations"}</button></form>{message && <output>{message}</output>}</section>;

  return <>
    <div className="betaSync"><div><strong>Account-aware pipeline</strong><span>Milestones refresh automatically when this dashboard opens. Use Sync after a tester completes a step while the page remains open.</span></div><button className="button secondary" onClick={sync} disabled={busy}>{busy ? "Synchronizing…" : "Sync account progress"}</button></div>
    <section className="betaMetrics"><article><span>Pipeline</span><strong>{summary.total}</strong><small>tracked collectors</small></article><article><span>Invited</span><strong>{summary.invited}</strong><small>awaiting signup</small></article><article><span>Imported</span><strong>{summary.imported}</strong><small>vault data loaded</small></article><article><span>Product milestone</span><strong>{summary.activated}</strong><small>20+ lots plus key action</small></article><article><span>Founder seats</span><strong>{summary.founderSeatsRemaining}</strong><small>remaining of {FOUNDER_BETA_SEAT_LIMIT}</small></article></section>
    {readiness && <section className={`betaReadiness card ${readiness.ready ? "ready" : "attention"}`}><header><div><div className="eyebrow">Invitation gate</div><h2>{readiness.ready ? "Ready for the controlled cohort" : "Hold invitations until every gate passes"}</h2><p>{readiness.readyCount} of {readiness.totalGates} minimum safeguards pass · {readiness.openFeedback} open feedback item(s)</p></div><strong>{readiness.readyCount}/{readiness.totalGates}</strong></header><div>{readiness.gates.map(gate => <article key={gate.key}><span className={gate.ready ? "pass" : "hold"}>{gate.ready ? "✓" : "!"}</span><div><b>{gate.label}</b><small>{gate.detail}</small></div></article>)}</div></section>}
    {message && <output className="betaMessage" aria-live="polite">{message}</output>}
    <section className="betaSupportGrid">
      <article className="card"><div className="eyebrow">Invitation recovery</div><h2>When an email link fails</h2><ol><li>Ask the tester to return to Hojavía and sign in once; a previously confirmed account does not need another confirmation.</li><li>If sign-in says the email is unconfirmed, open <a href={betaConfirmationRecoveryUrl} target="_blank" rel="noreferrer">the Hojavía sign-in recovery panel</a> and request one new confirmation email.</li><li>Use only the newest email and check spam. Older and already-used links should be discarded.</li></ol><p className="small">Do not create a second queue entry, change the invited email, or bypass account confirmation.</p></article>
      <article className="card"><div className="eyebrow">Phone acceptance</div><h2>One checklist for iPhone and Android</h2><ol>{betaDeviceAcceptanceSteps.map(step=><li key={step.key}><strong>{step.label}</strong><span>{step.detail}</span></li>)}</ol><p className="small">Record actual tester outcomes in Feedback. This checklist does not claim a device passed until a tester completes it.</p></article>
    </section>
    <section className="betaLayout"><div className="betaList">
      {items.map(item => {
        const next = betaNextAction(item.progress);
        const progressSteps = betaProgressSteps(item.progress);
        return <article key={item.id}>
          <div><small>{item.email}</small><h3>{item.name}</h3><p>{item.notes || "No follow-up notes yet."}</p></div>
          <label><span>Stage</span><select value={item.stage} disabled={busy} onChange={event => update(item, event.target.value as BetaStage)}>{stages.map(stage => <option value={stage} key={stage}>{betaStageLabel(stage)}</option>)}</select></label>
          <button type="button" className="button secondary" disabled={busy} onClick={async()=>{setBusy(true);setMessage("Submitting invitation…");try{const sent=await sendInvitation(item);if(sent.kind === "submitted")setMessage(sent.delivered ? `Delivery confirmed for ${item.email}.` : `Invitation submitted for ${item.email} · provider reference ${sent.providerId}. Delivery is not yet confirmed (status: ${sent.status}).`);else if(sent.kind === "prepared")setMessage(`Automated email is not configured. ${item.name}'s invitation is ready below—use Open Gmail to send it now.`)}catch(error){setMessage(error instanceof Error?error.message:"Unable to submit invitation")}finally{setBusy(false)}}}>{item.stage === "Prospect" ? "Submit invitation" : "Submit again"}</button>
          {item.invitationProviderId && <button type="button" className="textButton" disabled={busy} onClick={() => checkInvitation(item)}>Check delivery</button>}
          <small>Email status: {item.invitationDeliveryStatus || "not submitted"}{item.invitationDeliveredAt ? ` · delivered ${new Date(item.invitationDeliveredAt).toLocaleString()}` : ""}</small>
          {item.invitationDeliveryStatus === "failed" && <small>Delivery failed. Confirm the address, use the Gmail backup, or submit again after correcting the cause.</small>}
          {item.invitationDeliveryStatus === "unknown" && <small>Delivery has not been verified. Use Check delivery or the Gmail backup before enabling access.</small>}
          <button type="button" className="textButton" disabled={busy} onClick={() => prepare(item)}>{item.stage === "Prospect" ? "Open Gmail backup" : "View invitation / Gmail"}</button>
          <button type="button" className="button secondary" disabled={busy || item.stage === "Prospect"} onClick={() => sendReinstall(item)}>Send app update</button>
          <section className="betaCollectorProgress" aria-label={`${item.name} beta progress`}>
            <header><div><span>Next required action</span><strong>{next.label}</strong><small>{next.detail}</small></div><b>{progressSteps.filter(step => step.complete).length}/{progressSteps.length}</b></header>
            <div>{progressSteps.map(step => <a href={step.href} target="_blank" rel="noreferrer" className={step.complete ? "complete" : undefined} key={step.key}><span>{step.complete ? "✓" : "→"}</span><b>{step.label}</b><small>{step.detail}</small></a>)}</div>
          </section>
        </article>;
      })}
      {!items.length && <div className="emptyState">No beta collectors tracked yet.</div>}
      {prepared && preparedEmail && webmailLinks && <section className="betaEmailPreview card" aria-label={`Invitation for ${prepared.name}`}><header><div><div className="eyebrow">Invitation ready</div><h2>{prepared.name}</h2><small>{preparedEmail.recipient}</small></div><button type="button" className="button secondary" onClick={() => setPrepared(undefined)}>Close</button></header>{prepared.stage === "Prospect" ? <p><strong>Gmail backup required.</strong> Open Gmail, review and send the prepared message, return here, then select “I sent it — enable access.” Access remains disabled until that final confirmation.</p> : <p className="small">System invitation access is active. Gmail is available only as a backup copy.</p>}<label><span>Subject</span><input readOnly value={preparedEmail.subject}/></label><label><span>Message</span><textarea readOnly rows={15} value={preparedEmail.body}/></label><div className="betaEmailActions"><button type="button" className="button" onClick={copyInvitation}>{copied ? "Copied ✓" : "Copy invitation"}</button><a className="button secondary" href={webmailLinks.gmail} target="_blank" rel="noreferrer">Open Gmail</a><a className="button secondary" href={webmailLinks.outlook} target="_blank" rel="noreferrer">Open Outlook</a><a className="button secondary" href={webmailLinks.yahoo} target="_blank" rel="noreferrer">Open Yahoo Mail</a>{prepared.stage === "Prospect" && <button type="button" className="button" disabled={busy} onClick={confirmManualInvitation}>I sent it — enable access</button>}</div></section>}
    </div><aside className="card"><div className="eyebrow">Private beta</div><h2>Add and invite a tester</h2><p className="small">One action adds the tester and submits their invitation after your confirmation. Hojavía reports delivery separately and keeps access disabled until delivery is confirmed.</p><form className="betaForm" onSubmit={create} aria-busy={busy}><label><span>Name</span><input name="name" required/></label><label><span>Email</span><input name="email" type="email" required/></label><label><span>Notes</span><textarea name="notes" rows={4}/></label><button className="button" disabled={busy}>{busy?"Adding and submitting…":"Add & submit invitation"}</button></form></aside></section>
    <FounderBetaFeedback writeKey={key} onFeedbackUpdated={() => fetchReadiness()}/>
  </>;
}
