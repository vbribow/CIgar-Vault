import assert from "node:assert/strict";
import test from "node:test";
import {
  collectionComponentDrafts,
  collectionComponentIdentity,
  collectionComponentRepairs,
  collectionPhysicalLotRepairs,
  collectionPopulationCandidates,
  unmaterializedCollectionRequirements,
} from "../lib/collection-components";
import { collectionTemplates, type CollectionTemplate } from "../lib/collection-templates";
import { summarizeCollection } from "../lib/collection-dashboard";

const template: CollectionTemplate = {
  templateId: "TPL-TEST", name: "Test Set", maker: "Arturo Fuente",
  expectedComponents: 2, expectedCigars: 21,
  requirements: ["20 Double Corona cigars", "OpusX Lancero", "Original presentation box"],
  componentEvidence: [
    { requirement:"20 Double Corona cigars", brand:"Arturo Fuente", line:"Test Set", vitola:"Double Corona", sourceUrl:"https://example.com/double-corona", sourceLabel:"Official specification" },
    { requirement:"OpusX Lancero", brand:"Arturo Fuente", line:"OpusX", vitola:"Lancero", sourceUrl:"https://example.com/lancero", sourceLabel:"Official specification" },
  ],
  packaging: "Presentation box", matchingRule: "Match both cigars", accent: "#000",
  sourceUrl: "https://example.com", sourceLabel: "Official source", researchStatus: "Verified",
};
const collection = { collectionId: "COL-TEST", name: "Test Set", expectedComponents: 2 };

test("component creation multiplies quantities for multiple complete sets",()=>{
  const template={templateId:"TPL-TWO-SETS",name:"Two Sets",maker:"Arturo Fuente",releaseYear:2026,edition:"2026",expectedComponents:1,expectedCigars:2,requirements:["2 Don Carlos Robusto"],componentEvidence:[{requirement:"2 Don Carlos Robusto",brand:"Arturo Fuente",line:"Don Carlos",vitola:"Robusto (5.25 × 50)",sourceUrl:"https://example.com/source",sourceLabel:"Official source"}],packaging:"Collection box",matchingRule:"Exact",accent:"#000",sourceUrl:"https://example.com/source",sourceLabel:"Official source",researchStatus:"Verified" as const};
  const drafts=collectionComponentDrafts({...collection,ownedSetQty:2},template,[]);
  assert.equal(drafts[0]?.originalQty,4);
  assert.equal(drafts[0]?.currentQty,4);
});

test("complete collections create linked inventory lots with stated quantities", () => {
  const drafts = collectionComponentDrafts(collection, template, []);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].looseStickQty, 20);
  assert.equal(drafts[0].collectionId, "COL-TEST");
  assert.equal(drafts[0].vitola, "Double Corona");
  assert.equal((drafts[0] as { vintage?: number }).vintage, undefined);
  assert.match(drafts[0].catalogId ?? "", /^CIG-/);
  assert.equal(drafts[1].looseStickQty, 1);
  assert.equal(drafts[1].line, "OpusX");
  assert.equal(drafts[1].vitola, "Lancero");
});

test("collection population is idempotent and never creates packaging as a cigar", () => {
  const first = collectionComponentDrafts(collection, template, []);
  assert.deepEqual(collectionComponentDrafts(collection, template, first), []);
  assert.deepEqual(unmaterializedCollectionRequirements(template), ["Original presentation box"]);
});

test("new exact collection drafts are immediately countable as owned physical lots",()=>{
  const granTemplate=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-GRAN-FUMADA-2023")!;
  const granCollection={collectionId:"COL-FUENTE-GRAN-FUMADA-2023",name:granTemplate.name,releaseYear:2023};
  const drafts=collectionComponentDrafts(granCollection,granTemplate,[]);
  assert.equal(drafts.length,13);
  assert.equal(drafts.reduce((sum,item)=>sum+(item.originalQty??0),0),13);
  assert.equal(drafts.reduce((sum,item)=>sum+(item.currentQty??0),0),13);
  const summary=summarizeCollection(granCollection,drafts,[]);
  assert.equal(summary.completionPercent,100);
  assert.equal(summary.ownedComponents,13);
});

test("unattributed component evidence remains unresolved and cannot materialize inventory", () => {
  const unsupported:CollectionTemplate = {
    ...template,
    requirements:["OpusX Placeholder"],
    componentEvidence:[{
      requirement:"OpusX Placeholder",
      brand:"Arturo Fuente",
      line:"OpusX",
      vitola:"Placeholder",
    }],
  };
  assert.deepEqual(collectionComponentDrafts(collection,unsupported,[]),[]);
  assert.deepEqual(collectionComponentRepairs(collection,unsupported,[{
    inventoryId:"INV-TEST-C01",
    collectionId:collection.collectionId,
    brand:"Arturo Fuente",
    line:"OpusX",
    vitola:"Size to verify",
    currentQty:1,
    notes:"Expected component: OpusX Placeholder",
  }]),[]);
  assert.deepEqual(unmaterializedCollectionRequirements(unsupported),["OpusX Placeholder"]);
  assert.deepEqual(collectionPhysicalLotRepairs(collection,unsupported,[]),[]);
});

test("requirements fulfilled by reusable inventory are not duplicated", () => {
  const drafts = collectionComponentDrafts(collection, template, [], new Set(["20 Double Corona cigars"]));
  assert.deepEqual(drafts.map(item => item.vitola), ["Lancero"]);
});

test("collection population never silently consumes a standalone lot", () => {
  const standalone = {
    inventoryId: "INV-STANDALONE",
    brand: "Arturo Fuente",
    line: "Test Set",
    vitola: "Double Corona",
    currentQty: 20,
  };
  const linked = {
    ...standalone,
    inventoryId: "INV-LINKED",
    collectionId: collection.collectionId,
  };
  const otherCollection = {
    ...linked,
    inventoryId: "INV-OTHER",
    collectionId: "COL-OTHER",
  };
  assert.deepEqual(
    collectionPopulationCandidates(collection.collectionId, [
      standalone,
      linked,
      otherCollection,
    ]).map((item) => item.inventoryId),
    ["INV-LINKED"],
  );
});

test("new collection components inherit known retail from the exact same cigar identity", () => {
  const known = {
    inventoryId: "INV-KNOWN",
    brand: "Arturo Fuente",
    line: "Test Set",
    vitola: "Double Corona",
    retailValue: 42,
  };
  const [draft] = collectionComponentDrafts(collection, template, [known]);
  assert.equal(draft.retailValue, 42);
  assert.equal(draft.looseStickQty, 20);
});

test("nearby vitolas never share retail automatically", () => {
  const nearby = {
    inventoryId: "INV-KNOWN",
    brand: "Arturo Fuente",
    line: "Test Set",
    vitola: "Robusto",
    retailValue: 42,
  };
  const [draft] = collectionComponentDrafts(collection, template, [nearby]);
  assert.equal(draft.retailValue, undefined);
});

test("collection components preserve exact named families and mark unresolved vitolas for review", () => {
  const fuente = { ...template, requirements: ["OpusX Angel’s Share Fuente Fuente"] };
  assert.deepEqual(collectionComponentIdentity(fuente.requirements[0], fuente), {
    brand: "Arturo Fuente", line: "OpusX Angel’s Share Fuente Fuente", vitola: "Size to verify", quantity: 1, needsIdentityReview: true,
  });
  const unresolved = collectionComponentIdentity("Family Reserve", { ...template, maker: "Padrón" });
  assert.equal(unresolved.vitola, "Size to verify");
  assert.equal(unresolved.needsIdentityReview, true);
});

test("Dream to Dynasty preserves partner-facing brands and exact named cigars", () => {
  const dream = {
    ...template,
    name: "From Dream to Dynasty Collection",
    releaseYear: 2024,
    requirements: [
      "Ashton ESG 20-Year Salute",
      "J.C. Newman Diamond Crown Perfecto",
      "Fuente Fuente OpusX BBMF Natural",
    ],
  };
  assert.deepEqual(collectionComponentIdentity(dream.requirements[0], dream), {
    brand: "Ashton", line: "Ashton ESG 20-Year Salute", vitola: "Size to verify", quantity: 1, needsIdentityReview: true,
  });
  assert.equal(collectionComponentIdentity(dream.requirements[1], dream).brand, "Diamond Crown");
  assert.deepEqual(collectionComponentIdentity(dream.requirements[2], dream), {
    brand: "Arturo Fuente", line: "OpusX BBMF Natural", vitola: "Size to verify", quantity: 1, needsIdentityReview: true,
  });
});

test("legacy generated component rows are repaired without changing collector quantities", () => {
  const legacy = {
    inventoryId: "INV-TEST-C02", collectionId: "COL-TEST", brand: "Arturo Fuente", line: "Test Set",
    vitola: "OpusX Lancero", vintage: 2022, looseStickQty: 3, currentQty: 3, photoLink: "https://example.com/photo.jpg",
    notes: "Expected component: OpusX Lancero",
  };
  const repairs = collectionComponentRepairs(collection, { ...template, releaseYear: 2024 }, [legacy]);
  assert.equal(repairs.length, 1);
  assert.equal(repairs[0].line, "OpusX");
  assert.equal(repairs[0].vitola, "Lancero");
  assert.equal(repairs[0].currentQty, 3);
  assert.equal(repairs[0].vintage, 2022);
  assert.equal(repairs[0].photoLink, legacy.photoLink);
  assert.match(repairs[0].catalogId ?? "", /^CIG-/);
});

test("empty generated collection placeholders recover exact documented quantities", () => {
  const emptyPlaceholder = {
    inventoryId: "INV-TEST-C01", collectionId: "COL-TEST", brand: "Arturo Fuente", line: "Preview cigar",
    vitola: "Size to verify", originalQty: 0, currentQty: 0, looseStickQty: 0, smokedQty: 0,
    notes: "Expected component: 20 Double Corona cigars",
  };
  const repaired = collectionComponentRepairs(collection, template, [emptyPlaceholder])[0];
  assert.equal(repaired.originalQty, 20);
  assert.equal(repaired.currentQty, 20);
  assert.equal(repaired.looseStickQty, 20);
});

test("a consumed generated collection lot is never restored from its template", () => {
  const consumed = {
    inventoryId: "INV-TEST-C01", collectionId: "COL-TEST", brand: "Arturo Fuente", line: "Test Set",
    vitola: "Double Corona", originalQty: 20, currentQty: 0, looseStickQty: 0, smokedQty: 20,
    notes: "Expected component: 20 Double Corona cigars",
  };
  const repaired = collectionComponentRepairs(collection, template, [consumed]);
  assert.equal(repaired.length, 1);
  assert.equal(repaired[0].originalQty, 20);
  assert.equal(repaired[0].currentQty, 0);
  assert.equal(repaired[0].smokedQty, 20);
});

test("legacy generated rows discard an inherited collection year", () => {
  const legacy = {
    inventoryId: "INV-TEST-C02", collectionId: "COL-TEST", brand: "Arturo Fuente", line: "Test Set",
    vitola: "OpusX Lancero", vintage: 2024, looseStickQty: 3, currentQty: 3,
    notes: "Expected component: OpusX Lancero",
  };
  const repairs = collectionComponentRepairs(collection, { ...template, releaseYear: 2024 }, [legacy]);
  assert.equal(repairs.length, 1);
  assert.equal(repairs[0].vintage, undefined);
  assert.doesNotMatch(repairs[0].catalogId ?? "", /2024/);
});

test("a corrected sourced lineup updates only untouched generated quantities",()=>{
  const correctedTemplate={...template,expectedComponents:1,expectedCigars:1,requirements:["1 OpusX Lancero"],componentEvidence:[
    {requirement:"1 OpusX Lancero",brand:"Arturo Fuente",line:"OpusX",vitola:"Lancero",sourceUrl:"https://example.com/lancero",sourceLabel:"Official specification"},
  ]};
  const pristine={
    inventoryId:"INV-TEST-C01",collectionId:"COL-TEST",brand:"Arturo Fuente",line:"Preview cigar",vitola:"Toro",
    originalQty:2,currentQty:2,looseStickQty:2,smokedQty:0,notes:"Expected component: 2 Preview cigars",
  };
  const corrected=collectionComponentRepairs(collection,correctedTemplate,[pristine])[0];
  assert.equal(corrected.originalQty,1);
  assert.equal(corrected.currentQty,1);
  assert.equal(corrected.looseStickQty,1);

  const collectorAdjusted={...pristine,currentQty:1,looseStickQty:1};
  const preserved=collectionComponentRepairs(collection,correctedTemplate,[collectorAdjusted])[0];
  assert.equal(preserved.originalQty,2);
  assert.equal(preserved.currentQty,1);
});

test("researched repairs are idempotent and preserve collector-owned fields", () => {
  const legendsCollection = { collectionId: "COL-LEGENDS", name: "Fuente & Padrón Legends" };
  const legendsTemplate = {
    templateId: "TPL-LEGENDS", name: legendsCollection.name, maker: "Arturo Fuente × Padrón",
    expectedComponents: 1, expectedCigars: 20,
    requirements: ["20 Padrón-made cigars honoring Carlos A. Fuente, Sr."],
    componentEvidence: [{
      requirement: "20 Padrón-made cigars honoring Carlos A. Fuente, Sr.",
      brand: "Padrón", line: "Legends Carlos A. Fuente, Sr.", vitola: "Box-pressed Churchill (7 × 50)",
      sourceLabel: "Measured review", sourceUrl: "https://example.com/legends",
    }],
    packaging: "Presentation box", matchingRule: "Exact", accent: "#000",
    sourceUrl: "https://example.com/release", sourceLabel: "Release", researchStatus: "Verified" as const,
  };
  const legacy = {
    inventoryId: "INV-LEGENDS-C01", collectionId: legendsCollection.collectionId,
    brand: "Padrón", line: "Legends Carlos A. Fuente, Sr.", vitola: "Size to verify",
    vintage: 2018, currentQty: 17, photoLink: "https://example.com/photo.jpg", retailValue: 125,
    notes: "Expected component: 20 Padrón-made cigars honoring Carlos A. Fuente, Sr. · Exact vitola still requires verification.",
    status: "Review" as const,
  };
  const first = collectionComponentRepairs(legendsCollection, legendsTemplate, [legacy]);
  assert.equal(first.length, 1);
  assert.equal(first[0].currentQty, 17);
  assert.equal(first[0].photoLink, legacy.photoLink);
  assert.equal(first[0].retailValue, 125);
  assert.equal(first[0].vintage, 2018);
  assert.equal(first[0].provenanceNotes, "Collection component documented by Measured review: https://example.com/legends");
  assert.equal(collectionComponentRepairs(legendsCollection, legendsTemplate, first).length, 0);
});

test("Purple Dream legacy Scorpio quantity splits into two physical lots without changing totals", () => {
  const purple:CollectionTemplate = {
    ...template,
    templateId:"TPL-PURPLE",
    name:"Big Purple Dream Humidor",
    requirements:["10 OpusX Scorpio Maduro (lot 1 of 2)","10 OpusX Scorpio Maduro (lot 2 of 2)"],
    componentEvidence:[
      {requirement:"10 OpusX Scorpio Maduro (lot 1 of 2)",brand:"Arturo Fuente",line:"OpusX Heaven and Earth",vitola:"Scorpio Maduro",sourceUrl:"https://example.com/purple",sourceLabel:"Official contents"},
      {requirement:"10 OpusX Scorpio Maduro (lot 2 of 2)",brand:"Arturo Fuente",line:"OpusX Heaven and Earth",vitola:"Scorpio Maduro",sourceUrl:"https://example.com/purple",sourceLabel:"Official contents"},
    ],
  };
  const purpleCollection={collectionId:"COL-PURPLE",name:purple.name};
  const legacy={
    inventoryId:"INV-PURPLE-C01",collectionId:purpleCollection.collectionId,
    brand:"Arturo Fuente",line:"OpusX Heaven and Earth",vitola:"Scorpio Maduro",
    originalQty:20,currentQty:17,smokedQty:3,looseStickQty:17,
    provenanceNotes:"Collector provenance",notes:"Expected component: 20 OpusX Scorpio Maduro",
  };
  const repairs=collectionPhysicalLotRepairs(purpleCollection,purple,[legacy]);
  assert.equal(repairs.length,2);
  assert.deepEqual(repairs.map(item=>item.inventoryId),["INV-PURPLE-C01","INV-PURPLE-C02"]);
  assert.equal(repairs.reduce((sum,item)=>sum+(item.originalQty??0),0),20);
  assert.equal(repairs.reduce((sum,item)=>sum+(item.currentQty??0),0),17);
  assert.equal(repairs.reduce((sum,item)=>sum+(item.smokedQty??0),0),3);
  assert.deepEqual(collectionPhysicalLotRepairs(purpleCollection,purple,repairs),[]);
});
