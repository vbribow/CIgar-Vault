import assert from "node:assert/strict";
import test from "node:test";
import { collectionSearchUrl, inferCollectionDetails, parseCollectionSearchRss } from "../lib/collection-research";
import { collectionTemplates } from "../lib/collection-templates";
import { matchCollectionRequirements } from "../lib/collection-matching";
import type { InventoryItem } from "../lib/types";

test("collection research builds a cigar-specific web query", () => {
  const url = collectionSearchUrl("La Gran Fumada");
  assert.match(url, /La%20Gran%20Fumada%20cigar%20collection%20contents%20box%20set/);
});

test("collection research parses web results without markup", () => {
  const xml = `<rss><channel><item><title><![CDATA[La Gran &amp; Fumada]]></title><link>https://example.com/set</link><description><![CDATA[<b>13 cigars</b> &amp; cutter]]></description></item></channel></rss>`;
  assert.deepEqual(parseCollectionSearchRss(xml), [{ title: "La Gran & Fumada", url: "https://example.com/set", summary: "13 cigars & cutter", inferred: { expectedCigars: 13, confidence: "Medium" } }]);
});

test("collection research infers structured evidence without inventing fields", () => {
  assert.deepEqual(inferCollectionDetails("Arturo Fuente 2023 13-cigar collection offered for $2,850.00"), {
    releaseYear: 2023, expectedCigars: 13, marketValue: 2850, maker: "Arturo Fuente", confidence: "High",
  });
});

test("collection requirements match likely owned inventory", () => {
  const inventory = [{ inventoryId: "INV-1", brand: "Arturo Fuente", line: "OpusX BBMF", vitola: "Natural", currentQty: 1 }] as InventoryItem[];
  const [match] = matchCollectionRequirements(["OpusX BBMF Natural 2006 Selection"], inventory);
  assert.equal(match.inventoryId, "INV-1");
  assert.ok(match.score >= 0.45);
});

test("heritage catalog spans major Cuban, Dominican, and Nicaraguan makers", () => {
  const makers = new Set(collectionTemplates.map((item) => item.maker));
  for (const maker of ["Cohiba", "H. Upmann", "Partagás", "Arturo Fuente", "Davidoff", "La Aurora", "Padrón", "My Father", "Joya de Nicaragua"]) {
    assert.ok(makers.has(maker), `${maker} should have a researched collection entry`);
  }
});
