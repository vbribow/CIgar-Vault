import { AlertTestPanel } from "@/components/alert-test-panel";
import { notificationConfiguration } from "@/lib/alert-notifications";
import { getAlertDeliveries } from "@/lib/smartsheet";
import type { AlertDelivery } from "@/lib/types";
import "./alerts.css";

export const dynamic="force-dynamic";

export default async function AlertsPage(){
  const config=notificationConfiguration();
  const historyResult=config.history
    ?(await Promise.allSettled([getAlertDeliveries()]))[0]
    :undefined;
  const historyReady=!config.history||historyResult?.status==="fulfilled";
  const history:AlertDelivery[]=historyResult?.status==="fulfilled"?historyResult.value:[];
  const deliveryReady=(config.email||config.sms)&&config.history&&historyReady;
  const readinessLabel=deliveryReady
    ?"Delivery ready"
    :config.email||config.sms
      ?"Delivery blocked"
      :"Setup required";

  return <main className="shell">
    <section className="alertHero"><div><div className="eyebrow">Climate notifications</div><h1>Know before damage happens.</h1><p className="lede">Deliver critical climate and sensor warnings by email or text, then preserve proof of every alert.</p></div><div className="alertReadiness"><strong>{readinessLabel}</strong><span>{deliveryReady?[config.email&&"Email",config.sms&&"Text","History"].filter(Boolean).join(" · "):!config.history?"Alert history must be configured before unattended delivery":!historyReady?"Alert history is temporarily unavailable":"Add notification credentials and alert history storage"}</span></div></section>
    <section className="channelGrid"><article className={config.email?"ready":""}><span>Email</span><strong>{config.email?"Ready":"Not configured"}</strong><small>Transactional delivery through Resend</small></article><article className={config.sms?"ready":""}><span>Text message</span><strong>{config.sms?"Ready":"Not configured"}</strong><small>Urgent SMS delivery through Twilio</small></article><article className={config.history&&historyReady?"ready":""}><span>Alert history</span><strong>{!config.history?"Not configured":historyReady?"Ready":"Unavailable"}</strong><small>Required for duplicate suppression and the delivery audit trail</small></article></section>
    <AlertTestPanel email={config.email} sms={config.sms}/>
    <section className="alertHistory"><div className="sectionHead"><div><div className="eyebrow">Delivery ledger</div><h2>{historyReady?`${history.length} recorded alerts`:"History temporarily protected"}</h2></div><a className="textLink" href="/humidors">Climate command center →</a></div>{!historyReady?<div className="emptyState">The platform could not verify the alert ledger. Existing deliveries have not been classified as missing, and unattended alert readiness remains blocked until history storage recovers.</div>:history.length?<div className="tableWrap"><table className="table"><thead><tr><th>Detected</th><th>Humidor</th><th>Severity</th><th>Alert</th><th>Email</th><th>Text</th><th>Status</th></tr></thead><tbody>{history.slice(0,100).map(alert=><tr key={alert.alertId}><td>{alert.detectedAt.replace("T"," ")}</td><td>{alert.humidorId}</td><td><span className={`alertSeverity ${alert.severity.toLowerCase()}`}>{alert.severity}</span></td><td><strong>{alert.alertType}</strong><small>{alert.message}</small></td><td>{alert.emailSentAt?"Sent":"—"}</td><td>{alert.smsSentAt?"Sent":"—"}</td><td>{alert.status}</td></tr>)}</tbody></table></div>:<div className="emptyState">No alert deliveries yet. Alerts will appear here after notification storage is configured.</div>}</section>
  </main>;
}
