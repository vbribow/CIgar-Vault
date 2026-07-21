import assert from "node:assert/strict";
import test from "node:test";
import { collectionSearchUrl, parseCollectionSearchRss } from "../lib/collection-research";
import { collectionTemplates } from "../lib/collection-templates";

test("collection research builds a cigar-specific web query", () => {
  const url = collectionSearchUrl("La Gran Fumada");
  assert.match(url, /La%20Gran%20Fumada%20cigar%20collection%20contents%20box%20set/);
});

test("collection research parses web results without markup", () => {
  const xml = `<rss><channel><item><title><![CDATA[La Gran &amp; Fumada]]></title><link>https://example.com/set</link><description><![CDATA[<b>13 cigars</b> &amp; cutter]]></description></item></channel></rss>`;
  assert.deepEqual(parseCollectionSearchRss(xml), [{ title: "La Gran & Fumada", url: "https://example.com/set", summary: "13 cigars & cutter" }]);
});

test("heritage catalog spans major Cuban, Dominican, and Nicaraguan makers", () => {
  const makers = new Set(collectionTemplates.map((item) => item.maker));
  for (const maker of ["Cohiba", "H. Upmann", "Partagás", "Arturo Fuente", "Davidoff", "La Aurora", "Padrón", "My Father", "Joya de Nicaragua"]) {
    assert.ok(makers.has(maker), `${maker} should have a researched collection entry`);
  }
});
