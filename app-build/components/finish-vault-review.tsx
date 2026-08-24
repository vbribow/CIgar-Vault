"use client";

import { useMemo, useState } from "react";
import type { VaultReviewTask } from "@/lib/vault-review";

export function FinishVaultReview({ tasks, activeLots }: { tasks: VaultReviewTask[]; activeLots: number }) {
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const remaining = useMemo(() => tasks.filter(item => !skipped.has(item.id)), [skipped, tasks]);
  const current = remaining[0];
  const required = tasks.filter(item => !item.optional).length;
  const optional = tasks.length - required;

  function skip() {
    if (!current) return;
    setSkipped(value => new Set(value).add(current.id));
  }

  return <section className="finishVault card" id="finish-my-vault" aria-labelledby="finish-vault-title">
    <header>
      <div><div className="eyebrow">Guided record review</div><h2 id="finish-vault-title">Finish My Vault</h2><p>One cigar and one decision at a time. Hojavía never fills an unknown fact, merges a lot, or changes inventory unless you review and save it.</p></div>
      <div className="finishVaultCounts"><strong>{tasks.length}</strong><span>useful next step{tasks.length === 1 ? "" : "s"}</span><small>{required} important · {optional} optional · {activeLots} active lots</small></div>
    </header>
    {current ? <article className="finishVaultTask" aria-live="polite">
      <div className="finishVaultPosition"><span>Next task</span><b>{tasks.length - remaining.length + 1} of {tasks.length}</b></div>
      <div><small>{current.optional ? "Optional enrichment" : "Record integrity"} · {current.inventoryId}</small><h3>{current.cigar}</h3><p className="finishVaultVitola">{current.vitola}</p><strong>{current.title}</strong><p>{current.explanation}</p>{current.creditNotice && <aside className="finishVaultCredit"><b>Credit notice</b><span>{current.creditNotice}</span></aside>}</div>
      <div className="finishVaultActions"><a className="button" href={current.href}>{current.action}</a><button type="button" className="button secondary" onClick={skip}>Skip for now</button><a className="textLink" href="/inventory#inventory-records">Finish later</a></div>
    </article> : <div className="finishVaultComplete" role="status"><strong>{tasks.length ? "Review paused for now" : "No guided corrections are waiting"}</strong><p>{tasks.length ? "You skipped the remaining suggestions on this visit. No records were changed." : "Every active lot has passed the current record checks. Unknown optional facts remain clearly labeled elsewhere."}</p>{tasks.length > 0 && <button type="button" className="button secondary" onClick={() => setSkipped(new Set())}>Show skipped tasks again</button>}</div>}
  </section>;
}
