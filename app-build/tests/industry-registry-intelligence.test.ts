import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { IndustryPackagingInput,IndustryProductInput,IndustryReleaseInput,registryRevision } from "../lib/industry-registry";
import { buildProvenanceGraph } from "../lib/provenance-graph";
import { buildCollectionIntelligence } from "../lib/collection-intelligence";
import { buildDailyBriefing } from "../lib/daily-briefing";
import { buildTrustCoverage } from "../lib/trust-coverage";
import type { CatalogCigar,Humidor,HumidorReading,InventoryItem,Valuation } from "../lib/types";

const partnerId="2544af61-5328-4a82-9780-b50c996b298f";
const catalog:CatalogCigar={catalogId:"CAT-1",brand:"Example",line:"Reserva",vitola:"Toro",dimensions:"6 × 52",factory:"Example Factory",country:"Nicaragua",wrapper:"Habano",binder:"Nicaragua",filler:"Nicaragua",releaseYear:2024,packaging:"Box of 20",sourceUrl:"https://example.com/product",sourceName:"Official product page",sourceType:"Official",confidence:"High"};
const inventory:InventoryItem={inventoryId:"INV-1",catalogId:"CAT-1",brand:"Example",line:"Reserva",vitola:"Toro",vintage:2024,currentQty:10,retailValue:20,storageLocationId:"H1",photoLink:"https://example.com/photo.jpg",provenanceNotes:"Purchased from an authorized retailer."};

test("official registry schemas preserve product, release, and artifact distinctions",()=>{
  assert.equal(IndustryProductInput.parse({partnerId,brand:"Example",line:"Reserva",description:"A detailed official description of this premium cigar and its intended place in the company portfolio.",productionStatus:"current",officialProductUrl:"https://example.com/product"}).productionStatus,"current");
  assert.equal(IndustryReleaseInput.parse({partnerId,productName:"Example Reserva",releaseName:"Example Reserva 2026",releaseType:"limited_edition",releaseDate:"2026-07-24",availabilityStatus:"announced",vitolas:"Toro 6 × 52"}).releaseType,"limited_edition");
  assert.equal(IndustryPackagingInput.parse({partnerId,productName:"Example Reserva",artifactType:"band",revisionName:"2026 band revision",effectiveFrom:"2026-07-24",description:"The secondary band adds a dated gold footer and a revised factory mark for collector reference."}).artifactType,"band");
});

test("registry revisions permanently identify record type and actor",()=>{
  assert.deepEqual(registryRevision({partnerId,recordId:"c11a0f8b-b455-4870-8ba8-59e5e999a80d",recordType:"release",action:"founder.published",actor:"founder",snapshot:{releaseName:"Reserva 2026"}}),{partner_id:partnerId,record_id:"c11a0f8b-b455-4870-8ba8-59e5e999a80d",record_type:"release",action:"founder.published",actor:"founder",snapshot:{releaseName:"Reserva 2026"}});
});

test("provenance graph separates shared knowledge from private collector lots",()=>{
  const graph=buildProvenanceGraph(catalog,[inventory]);
  assert.ok(graph.nodes.some(node=>node.type==="Factory"&&node.trust==="Evidence-aware"));
  assert.ok(graph.nodes.some(node=>node.type==="Collector lot"&&node.trust==="Private"));
  assert.ok(graph.edges.some(edge=>edge.relationship==="is documented in"));
  assert.ok(graph.missing.includes("Release"));
});

test("daily briefing prioritizes actual climate evidence and labels AI guidance",()=>{
  const valuation:Valuation={valuationId:"V1",inventoryId:"INV-1",valuationDate:"2026-07-01",marketValue:20};
  const intelligence=buildCollectionIntelligence({inventory:[inventory],valuations:[valuation],humidors:[],readings:[],smokes:[]},new Date("2026-07-24T12:00:00Z"));
  const humidor:Humidor={humidorId:"H1",name:"Main humidor",targetTempF:67,minTempF:64,maxTempF:70,targetHumidity:67,minHumidity:64,maxHumidity:70};
  const reading:HumidorReading={readingId:"R1",humidorId:"H1",recordedAt:"2026-07-24T11:00:00Z",temperatureF:76,humidity:67};
  const brief=buildDailyBriefing({inventory:[inventory],humidors:[humidor],readings:[reading],sensors:[],intelligence},new Date("2026-07-24T12:00:00Z"));
  assert.equal(brief.items[0].priority,"Now");
  assert.equal(brief.items[0].source,"Climate evidence");
  assert.ok(brief.items.some(item=>item.source==="AI-assisted"));
});

test("trust scorecard exposes denominators and never hides research gaps",()=>{
  const score=buildTrustCoverage({catalog:[catalog],inventory:[inventory],profiles:[],registry:[]});
  assert.equal(score.canonical.total,1);
  assert.equal(score.metrics.find(item=>item.key==="source")?.denominator,1);
  assert.equal(score.metrics.find(item=>item.key==="collector-provenance")?.score,100);
  assert.ok(score.principles.some(item=>/Unknown facts remain visible/.test(item)));
});

test("registry migration creates no organization records or Fox activity",async()=>{
  const migration=await readFile(new URL("../supabase/migrations/202607240006_industry_registries.sql",import.meta.url),"utf8");
  assert.doesNotMatch(migration,/insert\s+into\s+public\.industry_registry/i);
  assert.doesNotMatch(migration,/fox/i);
  assert.match(migration,/Founder review and publication are separate actions/i);
});

test("partners cannot self-publish registry records",async()=>{
  const partnerRoute=await readFile(new URL("../app/api/partner-workspace/route.ts",import.meta.url),"utf8");
  const founderRoute=await readFile(new URL("../app/api/partners/route.ts",import.meta.url),"utf8");
  assert.match(partnerRoute,/saveIndustryProduct/);
  assert.match(partnerRoute,/submitIndustryRegistry/);
  assert.doesNotMatch(partnerRoute,/action:z\.literal\("publishIndustryRegistry"\)/);
  assert.match(founderRoute,/reviewIndustryRegistry/);
  assert.match(founderRoute,/publishIndustryRegistry/);
  assert.match(founderRoute,/requires separate founder approval before publication/i);
});
