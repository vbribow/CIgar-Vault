import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { catalogAcquisitionLane, catalogAcquisitionLanes, catalogEvidenceCandidates, catalogEvidenceFingerprint } from "../lib/catalog-acquisition";
import type { CatalogCigar } from "../lib/types";

const discovery={brand:"Example",line:"Reserva",vitola:"Toro",country:"Nicaragua",factory:"Factory A",brandOwner:"Example",blender:"",wrapper:"Habano",wrapperOrigin:"Ecuador",binder:"",binderOrigin:"",filler:"",fillerOrigins:"",dimensions:"6 × 52",strength:"Medium",packaging:"Box of 20",releaseYear:"2026",edition:"",referenceImageUrl:"",referenceImageSourceUrl:"",referenceImageSourceName:"",entityType:"Brand owner" as const,sourceUrl:"https://example.com/reserva",sourceTitle:"Official product page",evidenceDate:"2026-08-10",notes:"Exact product facts.",confidence:"High" as const};

test("weekly acquisition rotates heritage, boutique, trade, and growing-region lanes",()=>{
  assert.deepEqual(catalogAcquisitionLanes.map(lane=>lane.id),["heritage-official","boutique-official","trade-releases","origin-watch"]);
  const weeks=[0,7,14,21].map(days=>catalogAcquisitionLane(new Date(Date.UTC(2026,0,1+days))).id);
  assert.equal(new Set(weeks).size,4);
});
test("unchanged evidence is skipped while missing fields and conflicts enter review",()=>{
  const exact:CatalogCigar={catalogId:"CAT-1",...discovery,sourceType:"Official"};
  assert.equal(catalogEvidenceCandidates([discovery],[exact]).length,0);
  const enrichment=catalogEvidenceCandidates([{...discovery,wrapper:"Habano",binder:"Nicaraguan"}],[{...exact,binder:""}])[0]!;
  assert.equal(enrichment.status,"evidence-enrichment");
  assert.deepEqual(enrichment.changedFields,["binder"]);
  const conflict=catalogEvidenceCandidates([{...discovery,dimensions:"6 1/2 × 54"}],[exact])[0]!;
  assert.equal(conflict.status,"conflict-review");
  assert.deepEqual(conflict.changedFields,["dimensions"]);
  assert.equal(catalogEvidenceFingerprint(conflict),catalogEvidenceFingerprint(conflict));
});

test("weekly route queues field evidence once and never publishes article prose",()=>{
  const route=readFileSync(new URL("../app/api/catalog-discovery/run/route.ts",import.meta.url),"utf8");
  assert.match(route,/weekly-catalog-acquisition/);
  assert.match(route,/queueCigarKnowledgeProposals\(proposals\)/);
  assert.match(route,/evidenceFingerprint/);
  assert.match(route,/conflict-review/);
  assert.match(route,/never copy article prose/);
  assert.match(route,/Return at most 24/);
  assert.match(route,/reasoning:\{effort:"low"\}/);
});
