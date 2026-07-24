import assert from "node:assert/strict";
import test from "node:test";
import { collectionComponentDrafts, collectionComponentIdentity, collectionComponentRepairs, unmaterializedCollectionRequirements } from "../lib/collection-components";
import type { CollectionTemplate } from "../lib/collection-templates";

const template: CollectionTemplate = { templateId: "TPL-TEST", name: "Test Set", maker: "Arturo Fuente", expectedComponents: 2, expectedCigars: 21, requirements: ["20 Double Corona cigars", "OpusX Lancero", "Original presentation box"], packaging: "Presentation box", matchingRule: "Match both cigars", accent: "#000", sourceUrl: "https://example.com", sourceLabel: "Official source", researchStatus: "Verified" };
const collection = { collectionId: "COL-TEST", name: "Test Set", expectedComponents: 2 };

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

test("requirements fulfilled by reusable inventory are not duplicated", () => {
  const drafts = collectionComponentDrafts(collection, template, [], new Set(["20 Double Corona cigars"]));
  assert.deepEqual(drafts.map(item => item.vitola), ["Lancero"]);
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
