import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mobileCommercePolicy, removeCommercialNavigation } from "../lib/mobile-commerce-policy";

test("mobile commerce policy strips affiliate decoration without changing evidence order", () => {
  const listings = [{
    seller:"Example", sellerType:"Authorized retailer" as const, title:"Exact cigar",
    url:"https://shop.example.test/cigar", outboundUrl:"https://shop.example.test/cigar?aff=hojavia",
    commercialRelationship:"Affiliate — compensated link" as const,
    commercialDisclosure:"Hojavía may receive compensation if you purchase through this link.",
    availability:"In stock" as const, unitPrice:20, notes:"Exact match",
  }];
  const safe = removeCommercialNavigation(listings);
  assert.equal(mobileCommercePolicy.permitsRetailerPurchaseLinks, false);
  assert.equal(mobileCommercePolicy.permitsAffiliateTracking, false);
  assert.equal(safe[0].url, listings[0].url);
  assert.equal("outboundUrl" in safe[0], false);
  assert.equal("commercialRelationship" in safe[0], false);
});

test("mobile cigar-search and retailer surfaces contain no transactional retailer exit", async () => {
  const [search, market, clickRoute, decision, buyAgain] = await Promise.all([
    readFile(new URL("../components/research-any-cigar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/retailer-market.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/retailer-market/click/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/decision-center/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/buy-again-panel.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(search, /Retailer observations/);
  assert.doesNotMatch(search, /Where to buy|href=\{listing\.outboundUrl/);
  assert.doesNotMatch(market, /window\.open|View seller|openListing/);
  assert.match(clickRoute, /status: 410/);
  assert.doesNotMatch(decision, /href=\{listing\.url\}/);
  assert.doesNotMatch(buyAgain, /href=\{sourceUrl\}/);
});
