import { CedrivaMark } from "@/components/cedriva-mark";

export default function OfflinePage(){return <main className="shell offlinePage"><section className="card"><CedrivaMark/><div className="eyebrow">Connection unavailable</div><h1>Your vault remains private.</h1><p className="lede">Cedriva does not store private collection pages for offline viewing. Reconnect to load the latest inventory, values, climate readings, and community activity.</p><a className="button" href="/">Try again</a></section></main>}
