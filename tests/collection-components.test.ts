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

test("collection components preserve exact named families and mark unresolved vitolas for review", () => {
  const fuente = { ...template, requirements: ["OpusX Angel’s Share Fuente Fuente"] };
  assert.deepEqual(collectionComponentIdentity(fuente.requirements[0], fuente), {
    brand: "Arturo Fuente", line: "OpusX Angel’s Share", vitola: "Fuente Fuente", quantity: 1, needsIdentityReview: false,
  });
  const unresolved = collectionComponentIdentity("Family Reserve", { ...template, maker: "Padrón" });
  assert.equal(unresolved.vitola, "Vitola to verify");
  assert.equal(unresolved.needsIdentityReview, true);
});

test("legacy generated component rows are repaired without changing collector quantities", () => {
  const legacy = {
    inventoryId: "INV-TEST-C02", collectionId: "COL-TEST", brand: "Arturo Fuente", line: "Test Set",
    vitola: "OpusX Lancero", looseStickQty: 3, currentQty: 3, photoLink: "https://example.com/photo.jpg",
    notes: "Expected component: OpusX Lancero",
  };
  const repairs = collectionComponentRepairs(collection, template, [legacy]);
  assert.equal(repairs.length, 1);
  assert.equal(repairs[0].line, "OpusX");
  assert.equal(repairs[0].vitola, "Lancero");
  assert.equal(repairs[0].currentQty, 3);
  assert.equal(repairs[0].photoLink, legacy.photoLink);
  assert.match(repairs[0].catalogId ?? "", /^CIG-/);
});
