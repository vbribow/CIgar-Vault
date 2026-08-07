import { Dashboard } from "@/components/dashboard";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadHumidorReadings, loadHumidors, loadSensors, loadSmokingLogs, loadValuations } from "@/lib/data";
import { accountDataMode, loadAccountRecords } from "@/lib/user-data";
import { buildOnboardingSteps, type IntegrityAudit } from "@/lib/onboarding";
import { buildCollectionIntelligence } from "@/lib/collection-intelligence";
import { CollectorJourney } from "@/components/collector-journey";
import { DataModelStory } from "@/components/data-model-story";
import { brand } from "@/lib/brand";
import { cigarInventoryRecords } from "@/lib/collection-presentation";
import { CulturePromise } from "@/components/culture-promise";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [modeResult, inventoryResult] = await Promise.allSettled([accountDataMode(), loadInventory()]);
  const coreReady = modeResult.status === "fulfilled" && inventoryResult.status === "fulfilled";
  const mode = modeResult.status === "fulfilled" ? modeResult.value : "mock";
  const allItems = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
  const evidenceResults = coreReady ? await Promise.allSettled([
    loadCollections(),
    mode === "mock" ? Promise.resolve([]) : loadHumidors(),
    mode === "mock" ? Promise.resolve([]) : loadSensors(),
    loadValuations(),
    mode === "mock" ? Promise.resolve([]) : loadHumidorReadings(),
    mode === "mock" ? Promise.resolve([]) : loadSmokingLogs(),
    mode === "mock" ? Promise.resolve([]) : loadAccountRecords<IntegrityAudit>("integrity").then(records => records ?? []),
  ] as const) : undefined;
  const dashboardReady = coreReady && evidenceResults?.every(result => result.status === "fulfilled");
  const collections = evidenceResults?.[0]?.status === "fulfilled" ? evidenceResults[0].value : [];
  const items = cigarInventoryRecords(allItems, collections);
  const humidors = evidenceResults?.[1]?.status === "fulfilled" ? evidenceResults[1].value : [];
  const sensors = evidenceResults?.[2]?.status === "fulfilled" ? evidenceResults[2].value : [];
  const valuations = evidenceResults?.[3]?.status === "fulfilled" ? evidenceResults[3].value : [];
  const readings = evidenceResults?.[4]?.status === "fulfilled" ? evidenceResults[4].value : [];
  const smokes = evidenceResults?.[5]?.status === "fulfilled" ? evidenceResults[5].value : [];
  const integrityAudits = evidenceResults?.[6]?.status === "fulfilled" ? evidenceResults[6].value : [];
  const onboarding = buildOnboardingSteps({ inventory: allItems, collections, humidors, sensors, valuations, integrityAudits });
  const intelligence = buildCollectionIntelligence({ inventory: items, valuations, humidors, readings, smokes, sensors });
  const dashboard = dashboardReady
    ? <Dashboard items={items} onboarding={onboarding} intelligence={intelligence} />
    : <section className="section card"><div className="eyebrow">Private dashboard protected</div><h2>Your collection summary is temporarily paused.</h2><p className="small">{brand.name} could not verify every source needed for quantities, values, climate, history, and onboarding. Rather than present partial information as complete, the summary will remain paused until those records can be checked together.</p><a className="button secondary" href="/">Check again</a></section>;
  const introduction = <><section className="hero productHero"><div><div className="eyebrow">{brand.brandLine}</div><h1>{brand.isPreview ? "Your collection, with context." : "Your collection is a story worth preserving."}</h1><p className="lede">{brand.spokenName} helps every collector learn with confidence, document with purpose, and remain connected to the people and traditions behind every cigar.</p><div className="ctaRow"><a className="button" href="/inventory">Document my collection</a><a className="button secondary" href="/collector-walkthrough">Preview the collector journey</a><a className="button secondary" href="/discover">Discover something meaningful</a></div></div><figure className="cultureHero"><img src={"/editorial/cigar-roller-hojavia.jpg"} width="1540" height="1021" fetchPriority="high" decoding="async" alt="A cigar artisan sorting tobacco leaf at a rolling table while wearing a Hojavía shirt"/><figcaption><span>The craft behind the collection</span><strong>Every cigar begins with people, place, and patience.</strong><a href="https://unsplash.com/photos/vHCkVUogO-w">Original photograph by Austin · Unsplash ↗</a></figcaption></figure></section><CulturePromise/><CollectorJourney/><DataModelStory/></>;
  return <main className="shell">{dashboardReady ? <>{dashboard}{introduction}</> : <>{introduction}{dashboard}</>}</main>;
}
