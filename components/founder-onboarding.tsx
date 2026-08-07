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
import { FounderBetaFeedback } from "@/components/founder-beta-feedback";
import { forgetFounderSessionKey, readFounderSessionKey, rememberFounderSessionKey } from "@/lib/founder-session";

const stages: BetaStage[] = ["Prospect", "Invited", "Signed up", "Imported", "Activated"];
type Readiness = { ready:boolean; readyCount:number; totalGates:number; invited:number; signedUp:number; consented:number; backedUp:number; openFeedback:number; blockingFeedback:number; gates:Array<{key:string;label:string;ready:boolean;detail:string}> };

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

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/founder-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-founder-key": key },
      body: JSON.stringify({ name:form.get("name"), email:form.get("email"), stage:form.get("stage"), notes:form.get("notes") }),
    });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error); return; }
    setItems(current => [result.data, ...(current || [])]);
    event.currentTarget.reset();
    setMessage("Collector added to the onboarding queue.");
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update collector stage");
    } finally {
      setBusy(false);
    }
  }

  function prepare(item: BetaCollector) {
    if (item.stage !== "Invited") { setMessage("Move this collector to Invited before preparing access."); return; }
    if (!readiness?.ready) { setMessage("Invitation is held until every readiness gate passes."); return; }
    setPrepared(item);
    setCopied(false);
    setMessage(`Invitation prepared for ${item.name}. Copy it below or open your email app.`);
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

  if (!items) return <section className="card betaGate"><div><div className="eyebrow">Founder access</div><h2>Open the beta onboarding queue</h2><p>Protected by the same Founder key used for private operations. Tester progress refreshes automatically after access is confirmed.</p></div><form onSubmit={unlock}><label><span>Founder write key</span><input name="writeKey" type="password" required/></label><button className="button" disabled={busy}>{busy ? "Refreshing progress…" : "Open queue"}</button></form>{message && <output>{message}</output>}</section>;

  return <>
    <div className="betaSync"><div><strong>Account-aware pipeline</strong><span>Milestones refresh automatically when this dashboard opens. Use Sync after a tester completes a step while the page remains open.</span></div><button className="button secondary" onClick={sync} disabled={busy}>{busy ? "Synchronizing…" : "Sync account progress"}</button></div>
    <section className="betaMetrics"><article><span>Pipeline</span><strong>{summary.total}</strong><small>tracked collectors</small></article><article><span>Invited</span><strong>{summary.invited}</strong><small>awaiting signup</small></article><article><span>Imported</span><strong>{summary.imported}</strong><small>vault data loaded</small></article><article><span>Product milestone</span><strong>{summary.activated}</strong><small>20+ lots plus key action</small></article><article><span>Founder seats</span><strong>{summary.founderSeatsRemaining}</strong><small>remaining of 25</small></article></section>
    {readiness && <section className={`betaReadiness card ${readiness.ready ? "ready" : "attention"}`}><header><div><div className="eyebrow">Invitation gate</div><h2>{readiness.ready ? "Ready for the controlled cohort" : "Hold invitations until every gate passes"}</h2><p>{readiness.readyCount} of {readiness.totalGates} minimum safeguards pass · {readiness.openFeedback} open feedback item(s)</p></div><strong>{readiness.readyCount}/{readiness.totalGates}</strong></header><div>{readiness.gates.map(gate => <article key={gate.key}><span className={gate.ready ? "pass" : "hold"}>{gate.ready ? "✓" : "!"}</span><div><b>{gate.label}</b><small>{gate.detail}</small></div></article>)}</div></section>}
    {message && <output className="betaMessage" aria-live="polite">{message}</output>}
    <section className="betaSupportGrid">
      <article className="card"><div className="eyebrow">Invitation recovery</div><h2>When an email link fails</h2><ol><li>Ask the tester to return to Hojavía and sign in once; a previously confirmed account does not need another confirmation.</li><li>If sign-in says the email is unconfirmed, open <a href={betaConfirmationRecoveryUrl} target="_blank" rel="noreferrer">the Hojavía sign-in recovery panel</a> and request one new confirmation email.</li><li>Use only the newest email and check spam. Older and already-used links should be discarded.</li></ol><p className="small">Do not create a second queue entry, change the invited email, or bypass account confirmation.</p></article>
      <article className="card"><div className="eyebrow">Phone acceptance</div><h2>One checklist for iPhone and Android</h2><ol>{betaDeviceAcceptanceSteps.map(step=><li key={step.key}><strong>{step.label}</strong><span>{step.detail}</span></li>)}</ol><p className="small">Record actual tester outcomes in Feedback. This checklist does not claim a device passed until a tester completes it.</p></article>
    </section>
    <section className="betaLayout"><div className="betaList">
      {items.map(item => {
        const next = betaNextAction(item.progress);
        return <article key={item.id}>
          <div><small>{item.email}</small><h3>{item.name}</h3><p>{item.notes || "No follow-up notes yet."}</p></div>
          <label><span>Stage</span><select value={item.stage} disabled={busy} onChange={event => update(item, event.target.value as BetaStage)}>{stages.map(stage => <option value={stage} key={stage}>{betaStageLabel(stage)}</option>)}</select></label>
          <button type="button" className="button secondary" onClick={() => prepare(item)}>Prepare invite</button>
          <button type="button" className="button secondary" disabled={busy || item.stage === "Prospect"} onClick={() => sendReinstall(item)}>Send app update</button>
          <section className="betaCollectorProgress" aria-label={`${item.name} beta progress`}>
            <header><div><span>Next required action</span><strong>{next.label}</strong><small>{next.detail}</small></div><b>{betaProgressSteps(item.progress).filter(step => step.complete).length}/7</b></header>
            <div>{betaProgressSteps(item.progress).map(step => <a href={step.href} target="_blank" rel="noreferrer" className={step.complete ? "complete" : undefined} key={step.key}><span>{step.complete ? "✓" : "→"}</span><b>{step.label}</b><small>{step.detail}</small></a>)}</div>
          </section>
        </article>;
      })}
      {!items.length && <div className="emptyState">No beta collectors tracked yet.</div>}
      {prepared && preparedEmail && webmailLinks && <section className="betaEmailPreview card" aria-label={`Invitation for ${prepared.name}`}><header><div><div className="eyebrow">Invitation ready</div><h2>{prepared.name}</h2><small>{preparedEmail.recipient}</small></div><button type="button" className="button secondary" onClick={() => setPrepared(undefined)}>Close</button></header><label><span>Subject</span><input readOnly value={preparedEmail.subject}/></label><label><span>Message</span><textarea readOnly rows={15} value={preparedEmail.body}/></label><div className="betaEmailActions"><button type="button" className="button" onClick={copyInvitation}>{copied ? "Copied ✓" : "Copy invitation"}</button><a className="button secondary" href={webmailLinks.gmail} target="_blank" rel="noreferrer">Open Gmail</a><a className="button secondary" href={webmailLinks.outlook} target="_blank" rel="noreferrer">Open Outlook</a><a className="button secondary" href={webmailLinks.yahoo} target="_blank" rel="noreferrer">Open Yahoo Mail</a></div></section>}
    </div><aside className="card"><div className="eyebrow">White-glove onboarding</div><h2>Add a collector</h2><p className="small">Add the collector as a Prospect, then deliberately move them to Invited before sending access. No email is sent automatically.</p><form className="betaForm" onSubmit={create}><label><span>Name</span><input name="name" required/></label><label><span>Email</span><input name="email" type="email" required/></label><label><span>Stage</span><select name="stage">{stages.map(stage => <option value={stage} key={stage}>{betaStageLabel(stage)}</option>)}</select></label><label><span>Notes</span><textarea name="notes" rows={4}/></label><button className="button">Add to queue</button></form></aside></section>
    <FounderBetaFeedback writeKey={key} onFeedbackUpdated={() => fetchReadiness()}/>
  </>;
}
