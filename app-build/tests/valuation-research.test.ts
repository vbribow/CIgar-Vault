import assert from "node:assert/strict";
import test from "node:test";
import { parseValuationResearch, ValuationResearchSchema } from "../lib/valuation-research";
import { readFileSync } from "node:fs";

test("valuation research accepts traceable per-cigar evidence",()=>{const result=ValuationResearchSchema.parse({replacementValue:45,marketValue:60,source:"Auction result",sourceUrl:"https://example.com/lot",confidence:"Medium",evidenceDate:"2026-07-21",notes:"Normalized from a ten-cigar box.",comparables:[{title:"Ten-count box",url:"https://example.com/lot",unitPrice:60,notes:"$600 divided by 10"}]});assert.equal(result.marketValue,60)});
test("valuation research can decline unsupported pricing",()=>assert.equal(ValuationResearchSchema.parse({replacementValue:null,marketValue:null,source:"",sourceUrl:"",confidence:"Low",evidenceDate:"2026-07-21",notes:"Packaging is unclear.",comparables:[]}).marketValue,null));
test("valuation research keeps a verified completed sale separate from listings",()=>{const result=ValuationResearchSchema.parse({replacementValue:45,marketValue:60,lastSaleValue:58,lastSaleDate:"2026-06-10",lastSaleVenue:"Example Auctions",lastSaleSourceUrl:"https://example.com/sold-lot",source:"Retailer",sourceUrl:"https://example.com/listing",confidence:"High",evidenceDate:"2026-07-22",notes:"Completed ten-cigar lot normalized per cigar.",comparables:[]});assert.equal(result.lastSaleValue,58);assert.notEqual(result.lastSaleSourceUrl,result.sourceUrl)});

const completeDraft = {
  replacementValue: 22.7,
  marketValue: 22.7,
  lastSaleValue: null,
  lastSaleDate: null,
  lastSaleVenue: null,
  lastSaleSourceUrl: null,
  source: "Retailer",
  sourceUrl: "https://example.com/cigar",
  confidence: "Medium",
  evidenceDate: "2026-07-23",
  notes: "Current retailer evidence.",
  comparables: [],
};

test("valuation research parsing accepts a complete structured valuation", () => {
  assert.deepEqual(parseValuationResearch(JSON.stringify(completeDraft)), completeDraft);
});

test("valuation research parsing turns truncated output into a useful retry message", () => {
  assert.throws(
    () => parseValuationResearch('{"replacementValue":22.7,"notes":"cut off'),
    /response was incomplete/i,
  );
});

test("valuation research never treats owned quantity as original packaging", () => {
  const source=readFileSync(new URL("../lib/valuation-research.ts",import.meta.url),"utf8");
  assert.match(source,/current owned quantity is inventory balance only/);
  assert.match(source,/Never treat it as an original box count/);
  assert.match(source,/residual humidor value separately/);
  assert.match(source,/completed-result archives from established European auction houses/);
  assert.match(source,/whether the published result includes buyer's premium/);
});
