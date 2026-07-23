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
    <section className="hero productHero"><div><div className="eyebrow">Preserve · Honor · Grow</div><h1>Your collection is a story worth preserving.</h1><p className="lede">Cedriva connects the cigars you collect with their craftsmanship, history, memories, provenance, care, and community—helping premium cigar culture endure for generations.</p><div className="ctaRow"><a className="button" href="/inventory">Open my collection</a><a className="button secondary" href="/discover">Discover something meaningful</a></div></div><div className="card productPromise"><div className="eyebrow">Tradition, strengthened by technology</div><h2>Knowledge without barriers. Intelligence without pretense.</h2><p>Advanced tools respect experienced collectors while welcoming every beginner. Evidence is sourced, uncertainty is visible, and expertise is amplified—not replaced.</p><div className="trustLine"><span>Education</span><span>Trust</span><span>Community</span><span>Culture</span></div><a className="textLink" href="/explore">Explore the connected Cedriva experience →</a></div></section>
    <Dashboard items={items} onboarding={onboarding} intelligence={intelligence} />
  </main>;
}
