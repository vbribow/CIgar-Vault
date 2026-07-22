"use client";
import { useMemo, useState } from "react";
import type { CollectorNotification } from "@/lib/collector-notifications";
import type { WishlistItem } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:2 });

export function NotificationCenter({ notifications, items }:{ notifications:CollectorNotification[]; items:WishlistItem[] }) {
  const initialAcknowledged = useMemo(() => new Set(items.flatMap(item => item.acknowledgedNotificationIds || [])), [items]);
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const active = notifications.filter(item => !acknowledged.has(item.id));
  const archived = notifications.filter(item => acknowledged.has(item.id));
  const visible = showArchived ? archived : active;
  const matches = active.filter(item => item.kind === "Price match");
  const followUps = active.filter(item => item.kind === "Purchase follow-up");
  const highPriority = active.filter(item => item.priority === "High");

  async function update(item:CollectorNotification, value:boolean) {
    setBusy(item.id); setMessage("");
    const response = await fetch("/api/notifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({wishlistId:item.wishlistId, notificationId:item.id, acknowledged:value}) });
    const result = await response.json(); setBusy("");
    if (!response.ok) { setMessage(result.error || "Notification update failed"); return false; }
    setAcknowledged(current => { const next = new Set(current); if (value) next.add(item.id); else next.delete(item.id); return next; });
    return true;
  }

  async function clearAll() {
    for (const item of active) if (!await update(item, true)) break;
    setMessage("Inbox cleared. Alerts remain available under Acknowledged.");
  }

  return <>
    <section className="notificationHero"><div><div className="eyebrow">Collector intelligence</div><h1>Your vault inbox.</h1><p className="lede">Price opportunities, purchase follow-ups, and monitoring gaps gathered into one prioritized place.</p></div><div className="notificationPulse"><strong>{active.length}</strong><span>items need review</span><small>{highPriority.length} high priority</small></div></section>
    <section className="notificationMetrics"><article><span>Price matches</span><strong>{matches.length}</strong><small>At or below your target</small></article><article><span>Best current match</span><strong>{matches.length ? money.format(Math.min(...matches.map(item => item.price || Infinity))) : "—"}</strong><small>Per-cigar asking price</small></article><article><span>Purchases to file</span><strong>{followUps.length}</strong><small>Not yet in owned inventory</small></article></section>
    <section className="notificationWorkspace"><div className="sectionHead notificationToolbar"><div><div className="eyebrow">Priority queue</div><h2>{showArchived ? "Acknowledged alerts" : "What needs your attention"}</h2></div><div><button className="button secondary" onClick={() => setShowArchived(value => !value)}>{showArchived ? `Inbox (${active.length})` : `Acknowledged (${archived.length})`}</button>{!showArchived && active.length > 0 && <button className="button secondary" disabled={Boolean(busy)} onClick={clearAll}>Acknowledge all</button>}<a className="textLink" href="/wishlist">Open wishlist →</a></div></div>
      {message && <output className="notificationMessage">{message}</output>}
      <div className="notificationList">{visible.map(item => <article className={`notificationItem ${item.priority.toLowerCase()}`} key={item.id}><div className="notificationKind"><i/><span>{item.kind}</span><small>{item.priority}</small></div><div><h3>{item.title}</h3><p>{item.detail}</p><small>{new Date(item.occurredAt).toLocaleString()}</small></div><div className="notificationActions"><a className="button secondary" href={item.href}>Review</a>{item.externalUrl && <a className="button" href={item.externalUrl} target="_blank" rel="noreferrer">View listing ↗</a>}<button className="notificationDone" disabled={Boolean(busy)} onClick={() => update(item, !showArchived)}>{busy === item.id ? "Saving…" : showArchived ? "Restore" : "Acknowledge"}</button></div></article>)}
      {!visible.length && <div className="notificationClear"><strong>{showArchived ? "No acknowledged alerts." : "All caught up."}</strong><span>{showArchived ? "Acknowledged items remain here while their underlying condition exists." : "The monitor has no price matches or follow-ups requiring attention."}</span>{!showArchived && <a className="button secondary" href="/wishlist">Manage wishlist</a>}</div>}</div>
    </section>
  </>;
}
