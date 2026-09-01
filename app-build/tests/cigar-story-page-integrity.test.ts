import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page=fs.readFileSync(new URL("../app/cigars/[identityId]/page.tsx",import.meta.url),"utf8");
const story=fs.readFileSync(new URL("../lib/cigar-story.ts",import.meta.url),"utf8");

test("Cigar Story presents mixed evidence honestly and excludes invalidated valuations",()=>{
  assert.match(page,/Collector record with linked sources/);
  assert.doesNotMatch(page,/kind: "Official"/);
  assert.match(story,/!item\.invalidatedAt/);
  assert.match(story,/item\.askingPriceSourceUrl, item\.lastSaleSourceUrl/);
});

test("Cigar Story labels valuation evidence and never creates dead evidence links",()=>{
  assert.match(page,/marketAskingPriceLabel/);
  assert.match(page,/completedSaleLabel/);
  assert.match(page,/claimsUnverifiedCompletedSale/);
  assert.match(page,/active connected records/);
  assert.doesNotMatch(page,/href=\{item\.sourceUrl \|\| "#"\}/);
  assert.doesNotMatch(page,/href=\{evidence\.url\} target=/);
});

test("Cigar Story distinguishes one-month price comparison from monthly movement",()=>{
  assert.match(page,/One month of prices · no trend yet/);
  assert.match(page,/distinct month/);
  assert.match(page,/evidence categories are never mixed/);
});
