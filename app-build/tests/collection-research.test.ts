import assert from "node:assert/strict";
import test from "node:test";
import { collectionResultIsRelevant, collectionSearchUrl, collectionVerificationSearchUrls, inferCollectionDetails, parseCollectionSearchRss } from "../lib/collection-research";
import { collectionTemplateMatchesSearch,collectionTemplates } from "../lib/collection-templates";
import { matchCollectionRequirements } from "../lib/collection-matching";
import type { InventoryItem } from "../lib/types";

test("collection research builds a cigar-specific web query", () => {
  const url = collectionSearchUrl("La Gran Fumada");
  assert.match(url, /La%20Gran%20Fumada%20cigar%20collection%20contents%20box%20set/);
});

test("every collection verification pass includes an exact Fox Cigar search",()=>{
  const urls=collectionVerificationSearchUrls("From Dream to Dynasty");
  assert.equal(urls.length,2);
  assert.match(decodeURIComponent(urls[1]),/site:foxcigar\.com/);
});

test("collection research parses web results without markup", () => {
  const xml = `<rss><channel><item><title><![CDATA[La Gran &amp; Fumada]]></title><link>https://example.com/set</link><description><![CDATA[<b>13 cigars</b> &amp; cutter]]></description></item></channel></rss>`;
  assert.deepEqual(parseCollectionSearchRss(xml), [{ title: "La Gran & Fumada", url: "https://example.com/set", summary: "13 cigars & cutter", inferred: { expectedCigars: 13, confidence: "Medium" } }]);
});

test("collection research rejects Hemingway House restaurant results",()=>{
  const restaurant={title:"Hemingway House Italian Restaurant",url:"https://example.com/restaurants/hemingway-house",summary:"Italian cuisine, dining menu, and reservations."};
  assert.equal(collectionResultIsRelevant(restaurant,"Arturo Fuente Hemingway House collection"),false);
  const cigar={title:"Arturo Fuente Hemingway House Collection",url:"https://cigars.example/fuente-hemingway-house",summary:"A documented Fuente cigar collection with perfecto cigars."};
  assert.equal(collectionResultIsRelevant(cigar,"Arturo Fuente Hemingway House collection"),true);
  const singularTitle={title:"Elie Bleu Fuente Hemingway House of Dream",url:"https://cigars.example/hemingway-house-of-dream",summary:"A 60-cigar OpusX humidor collection."};
  assert.equal(collectionResultIsRelevant(singularTitle,"Hemingway House of Dreams Humidor"),true);
});

test("Hemingway House of Dreams is available as a researched exact collection",()=>{
  const template=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-HEMINGWAY-HOUSE-DREAMS");
  assert.ok(template);
  assert.equal(template.expectedCigars,60);
  assert.equal(template.expectedComponents,1);
  assert.match(template.requirements[0]||"",/7 × 48/);
  assert.equal(template.researchStatus,"Verified");
});

test("catalog search recognizes Stairway to Heaven and possessive wording variations",()=>{
  const template=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-STAIRWAY");
  assert.ok(template);
  assert.equal(collectionTemplateMatchesSearch(template,"angels share stairway to heaven"),true);
  assert.equal(collectionTemplateMatchesSearch(template,"Angel's Share Collection"),true);
  assert.equal(collectionTemplateMatchesSearch(template,"Elie Bleu Stairway to Heaven Humidor"),true);
});

test("RSS parsing applies the exact collection relevance gate",()=>{
  const xml=`<rss><channel><item><title>Hemingway House Italian Restaurant</title><link>https://example.com/restaurant</link><description>Italian menu and reservations</description></item><item><title>Arturo Fuente Hemingway House Collection</title><link>https://cigars.example/fuente</link><description>Fuente cigar collection and humidor</description></item></channel></rss>`;
  const results=parseCollectionSearchRss(xml,"Arturo Fuente Hemingway House collection");
  assert.equal(results.length,1);assert.match(results[0]!.title,/Arturo Fuente/);
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
