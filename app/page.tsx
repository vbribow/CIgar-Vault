import { Dashboard } from "@/components/dashboard";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadHumidorReadings, loadHumidors, loadSensors, loadSmokingLogs, loadValuations } from "@/lib/data";
import { accountDataMode, loadAccountRecords } from "@/lib/user-data";
import { buildOnboardingSteps, type IntegrityAudit } from "@/lib/onboarding";
import { buildCollectionIntelligence } from "@/lib/collection-intelligence";

export const dynamic = "force-dynamic";

export default async function Home() {
  const mode = await accountDataMode();
  const items = await loadInventory();
  const [collections, humidors, sensors, valuations, readings, smokes, integrityAudits] = mode === "mock"
    ? [[], [], [], [], [], [], []]
    : await Promise.all([loadCollections(), loadHumidors(), loadSensors(), loadValuations(), loadHumidorReadings(), loadSmokingLogs(), loadAccountRecords<IntegrityAudit>("integrity").then(records => records ?? [])]);
  const onboarding = buildOnboardingSteps({ inventory:items, collections, humidors, sensors, valuations, integrityAudits });
  const intelligence=buildCollectionIntelligence({inventory:items,valuations,humidors,readings,smokes,sensors});
  return <main className="shell">
    <section className="hero productHero"><div><div className="eyebrow">Private collection intelligence</div><h1>Know every cigar. Protect the whole collection.</h1><p className="lede">Cigar Vault brings inventory, collectible sets, current values, provenance, storage climate, and acquisition planning into one collector-controlled record.</p><div className="ctaRow"><a className="button" href="/inventory">Open inventory</a><a className="button secondary" href="/reports">View collection report</a></div></div><div className="card productPromise"><div className="eyebrow">Built for the collection itself</div><h2>From individual cigar to complete vault.</h2><p>Count boxes and loose cigars, verify Cuban packaging, research replacement value, monitor humidors, and preserve an exportable record.</p><div className="trustLine"><span>Private account records</span><span>Smartsheet-compatible</span><span>Downloadable backups</span></div></div></section>
    <Dashboard items={items} onboarding={onboarding} intelligence={intelligence} />
  </main>;
}
