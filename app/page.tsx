import { Dashboard } from "@/components/dashboard";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadHumidorReadings, loadHumidors, loadSensors, loadSmokingLogs, loadValuations } from "@/lib/data";
import { accountDataMode, loadAccountRecords } from "@/lib/user-data";
import { buildOnboardingSteps, type IntegrityAudit } from "@/lib/onboarding";
import { buildCollectionIntelligence } from "@/lib/collection-intelligence";
import { CollectorJourney } from "@/components/collector-journey";
import { DataModelStory } from "@/components/data-model-story";

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
    <section className="hero productHero"><div><div className="eyebrow">Preserve · Honor · Grow</div><h1>Your collection is a story worth preserving.</h1><p className="lede">Cedriva helps every collector learn with confidence, document with purpose, and remain connected to the people and traditions behind every cigar.</p><div className="ctaRow"><a className="button" href="/inventory">Document my collection</a><a className="button secondary" href="/discover">Discover something meaningful</a></div></div><figure className="cultureHero"><img src="/editorial/cigar-roller.jpg" alt="A cigar artisan working with tobacco leaves at a rolling table"/><figcaption><span>The craft behind the collection</span><strong>Every cigar begins with people, place, and patience.</strong><a href="https://unsplash.com/photos/vHCkVUogO-w" target="_blank" rel="noreferrer">Photograph by Austin · Unsplash ↗</a></figcaption></figure></section>
    <CollectorJourney/>
    <DataModelStory/>
    <Dashboard items={items} onboarding={onboarding} intelligence={intelligence} />
  </main>;
}
