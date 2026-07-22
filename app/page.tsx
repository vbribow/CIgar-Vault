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
    <section className="hero productHero"><div><div className="eyebrow">Private collector command center</div><h1>Know every cigar. See the whole market picture.</h1><p className="lede">Cigar Vault connects inventory, collectible sets, current values, provenance, cellar conditions, and acquisition decisions in one collector-controlled intelligence platform.</p><div className="ctaRow"><a className="button" href="/inventory">Open inventory</a><a className="button secondary" href="/decision-center">Open decision center</a></div></div><div className="card productPromise"><div className="eyebrow">Intelligence with evidence</div><h2>Every position. Every signal. One vault.</h2><p>Count boxes and singles, verify provenance, monitor replacement value and market movement, protect climate, and preserve an exportable record.</p><div className="trustLine"><span>Private account records</span><span>Evidence-backed signals</span><span>Downloadable backups</span></div></div></section>
    <Dashboard items={items} onboarding={onboarding} intelligence={intelligence} />
  </main>;
}
