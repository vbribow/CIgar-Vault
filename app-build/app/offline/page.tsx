import { HojaviaMark } from "@/components/hojavia-mark";
import { brand } from "@/lib/brand";

export default function OfflinePage(){return <main className="shell offlinePage"><section className="card" role="status">{!brand.isPreview&&<HojaviaMark/>}<div className="eyebrow">Connection unavailable</div><h1>Your vault remains private.</h1><p className="lede">{brand.name} saves only this protective offline screen—not private inventory, values, climate readings, or community activity. Reconnect before relying on collection information.</p><div className="offlineAssurance"><strong>No stale collection totals are shown.</strong><span>Your records have not been classified as empty, missing, or changed.</span></div><a className="button" href="/">Reconnect and try again</a></section></main>}
