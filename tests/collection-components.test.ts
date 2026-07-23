import assert from "node:assert/strict";
import test from "node:test";
import { collectionComponentDrafts, unmaterializedCollectionRequirements } from "../lib/collection-components";
import type { CollectionTemplate } from "../lib/collection-templates";

const template: CollectionTemplate = { templateId: "TPL-TEST", name: "Test Set", maker: "Arturo Fuente", expectedComponents: 2, expectedCigars: 21, requirements: ["20 Double Corona cigars", "OpusX Lancero", "Original presentation box"], packaging: "Presentation box", matchingRule: "Match both cigars", accent: "#000", sourceUrl: "https://example.com", sourceLabel: "Official source", researchStatus: "Verified" };
const collection = { collectionId: "COL-TEST", name: "Test Set", expectedComponents: 2 };

test("complete collections create linked inventory lots with stated quantities", () => {
  const drafts = collectionComponentDrafts(collection, template, []);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].looseStickQty, 20);
  assert.equal(drafts[0].collectionId, "COL-TEST");
  assert.equal(drafts[1].looseStickQty, 1);
});

test("collection population is idempotent and never creates packaging as a cigar", () => {
  const first = collectionComponentDrafts(collection, template, []);
  assert.deepEqual(collectionComponentDrafts(collection, template, first), []);
  assert.deepEqual(unmaterializedCollectionRequirements(template), ["Original presentation box"]);
});

test("requirements fulfilled by reusable inventory are not duplicated", () => {
  const drafts = collectionComponentDrafts(collection, template, [], new Set(["20 Double Corona cigars"]));
  assert.deepEqual(drafts.map(item => item.vitola), ["OpusX Lancero"]);
});
