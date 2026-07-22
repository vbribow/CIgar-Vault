import { buildCollectorNotifications } from "@/lib/collector-notifications";
import { loadWishlist } from "@/lib/data";
import "./notifications.css";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default async function NotificationsPage() {
  const wishlist = await loadWishlist();
  const notifications = buildCollectorNotifications(wishlist);
  const matches = notifications.filter(item => item.kind === "Price match");
  const followUps = notifications.filter(item => item.kind === "Purchase follow-up");
  const highPriority = notifications.filter(item => item.priority === "High");

  return <main className="shell notificationPage">
    <section className="notificationHero">
      <div><div className="eyebrow">Collector intelligence</div><h1>Your vault inbox.</h1><p className="lede">Price opportunities, purchase follow-ups, and monitoring gaps gathered into one prioritized place.</p></div>
      <div className="notificationPulse"><strong>{notifications.length}</strong><span>items need review</span><small>{highPriority.length} high priority</small></div>
    </section>
    <section className="notificationMetrics">
      <article><span>Price matches</span><strong>{matches.length}</strong><small>At or below your target</small></article>
      <article><span>Best current match</span><strong>{matches.length ? money.format(Math.min(...matches.map(item => item.price || Infinity))) : "—"}</strong><small>Per-cigar asking price</small></article>
      <article><span>Purchases to file</span><strong>{followUps.length}</strong><small>Not yet in owned inventory</small></article>
    </section>
    <section className="notificationWorkspace">
      <div className="sectionHead"><div><div className="eyebrow">Priority queue</div><h2>What needs your attention</h2></div><a className="textLink" href="/wishlist">Open wishlist →</a></div>
      <div className="notificationList">
        {notifications.map(item => <article className={`notificationItem ${item.priority.toLowerCase()}`} key={item.id}>
          <div className="notificationKind"><i/><span>{item.kind}</span><small>{item.priority}</small></div>
          <div><h3>{item.title}</h3><p>{item.detail}</p><small>{new Date(item.occurredAt).toLocaleString()}</small></div>
          <div className="notificationActions"><a className="button secondary" href={item.href}>Review</a>{item.externalUrl && <a className="button" href={item.externalUrl} target="_blank" rel="noreferrer">View listing ↗</a>}</div>
        </article>)}
        {!notifications.length && <div className="notificationClear"><strong>All caught up.</strong><span>The monitor has no price matches or follow-ups requiring attention.</span><a className="button secondary" href="/wishlist">Manage wishlist</a></div>}
      </div>
    </section>
  </main>;
}
