import Link from "next/link";
import { SmokeJournalBrowser } from "@/components/smoke-journal-browser";
import { loadSmokingLogs } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode } from "@/lib/user-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Smoke Journal", description: "Search and revisit your private Hojavía tasting history." };

export default async function SmokeJournalPage({ searchParams }: { searchParams:Promise<{ editSmoke?:string }> }) {
  const [{ editSmoke }, smokesResult, inventoryResult, modeResult] = await Promise.all([
    searchParams,
    loadSmokingLogs().then(value=>({ok:true as const,value})).catch(()=>({ok:false as const})),
    loadInventory().then(value=>({ok:true as const,value})).catch(()=>({ok:false as const})),
    accountDataMode().then(value=>({ok:true as const,value})).catch(()=>({ok:false as const})),
  ]);
  const ready = smokesResult.ok && inventoryResult.ok && modeResult.ok && (modeResult.value === "supabase" || smokesResult.value.length > 0);
  return <main className="shell smokeJournalPage">
    <section className="journalHero">
      <div><div className="eyebrow">Your private experience record</div><h1>My Smoke Journal</h1><p className="lede">Revisit every cigar you logged, search your own tasting language, and return to the exact Vault record when one is connected.</p></div>
      <div className="ctaRow"><Link className="button" href="/records#log-smoke">Log a smoke</Link><Link className="button secondary" href="/inventory">Return to Vault</Link></div>
    </section>
    {!ready ? <section className="card journalUnavailable" role="alert"><div className="eyebrow">Journal records protected</div><h2>Your journal is temporarily unavailable.</h2><p>Hojavía could not verify both your smoking history and Vault records. Nothing is being shown as empty or matched to the wrong cigar.</p><Link className="button secondary" href="/smoke-journal">Try again</Link></section> : <SmokeJournalBrowser smokes={smokesResult.value} inventory={inventoryResult.value} mode={modeResult.value} initialEditSmokeId={editSmoke} />}
  </main>;
}
