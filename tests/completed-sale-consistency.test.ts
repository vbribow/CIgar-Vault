import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path:string) => readFileSync(new URL(path,import.meta.url),"utf8");

test("completed-sale renderers use the centralized proof predicate and legacy label",()=>{
  const inventory=read("../app/inventory/[inventoryId]/page.tsx");
  const valuations=read("../app/valuations/page.tsx");
  const auction=read("../app/auction-market/page.tsx");
  const records=read("../components/records-manager.tsx");
  const timeline=read("../lib/collection-intelligence.ts");
  assert.match(inventory,/completedSaleLabel\(legacySaleClaim\)/);
  assert.match(valuations,/latestVerifiedSale/);
  assert.match(valuations,/completedSaleLabel\(row\.latestLegacySaleClaim\)/);
  assert.match(auction,/filter\(isVerifiedCompletedSale\)/);
  assert.match(records,/completedSaleLabel\(value\)/);
  assert.match(timeline,/isVerifiedCompletedSale\(value\)/);
});

test("valuation renderers identify asking prices as listings with no confirmed sale",()=>{
  const inventory=read("../app/inventory/[inventoryId]/page.tsx");
  const valuations=read("../app/valuations/page.tsx");
  const records=read("../components/records-manager.tsx");
  assert.match(inventory,/marketAskingPriceLabel/);
  assert.match(valuations,/marketAskingPriceLabel/);
  assert.match(records,/Market asking price \/ cigar — no confirmed sale/);
});
