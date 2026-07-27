import { CedrivaMark } from "@/components/cedriva-mark";
import { brand } from "@/lib/brand";

export default function OfflinePage(){return <main className="shell offlinePage"><section className="card">{!brand.isPreview&&<CedrivaMark/>}<div className="eyebrow">Connection unavailable</div><h1>Your vault remains private.</h1><p className="lede">{brand.name} does not store private collection pages for offline viewing. Reconnect to load the latest inventory, values, climate readings, and community activity.</p><a className="button" href="/">Try again</a></section></main>}
