import assert from "node:assert/strict";
import test from "node:test";
import { parseValuationResearch, valuationRetailLead, ValuationResearchSchema } from "../lib/valuation-research";
import { readFileSync } from "node:fs";

test("valuation research accepts a range supported by two secondary signals",()=>{const result=ValuationResearchSchema.parse({replacementValue:45,marketValue:60,marketEvidenceType:"Estimated market range",marketRangeLow:55,marketRangeHigh:65,askingPrice:65,askingPriceSource:"Specialty dealer",askingPriceSourceUrl:"https://example.com/listing",source:"Secondary evidence",sourceUrl:"https://example.com/lot",confidence:"Medium",evidenceDate:"2026-07-21",notes:"Two exact secondary signals.",comparables:[{title:"Exact retail",url:"https://example.com/retail",unitPrice:45,kind:"Retail replacement",notes:"Per cigar"},{title:"Completed ten-count lot",url:"https://example.com/lot",unitPrice:55,kind:"Verified completed sale",notes:"Normalized per cigar"},{title:"Exact dealer listing",url:"https://example.com/listing",unitPrice:65,kind:"Secondary asking price",notes:"Public asking price"}]});assert.equal(result.marketValue,60)});
test("valuation research can decline unsupported pricing",()=>assert.equal(ValuationResearchSchema.parse({replacementValue:null,marketValue:null,source:"",sourceUrl:"",confidence:"Low",evidenceDate:"2026-07-21",notes:"Packaging is unclear.",comparables:[]}).marketValue,null));
test("valuation research keeps a verified completed sale separate from listings",()=>{const result=ValuationResearchSchema.parse({replacementValue:45,marketValue:58,marketEvidenceType:"Verified completed sale",lastSaleValue:58,lastSaleDate:"2026-06-10",lastSaleVenue:"Example Auctions",lastSaleSourceUrl:"https://example.com/sold-lot",askingPrice:65,askingPriceSource:"Dealer",askingPriceSourceUrl:"https://example.com/listing",source:"Auction",sourceUrl:"https://example.com/sold-lot",confidence:"High",evidenceDate:"2026-07-22",notes:"Completed ten-cigar lot normalized per cigar.",comparables:[{title:"Exact retail",url:"https://example.com/retail",unitPrice:45,kind:"Retail replacement",notes:"Per cigar"}]});assert.equal(result.lastSaleValue,58);assert.notEqual(result.lastSaleSourceUrl,result.askingPriceSourceUrl)});
test("valuation research exposes a direct retail lead without calling it a sale",()=>{const research=ValuationResearchSchema.parse({replacementValue:45,marketValue:null,marketEvidenceType:"Insufficient evidence",source:"Retailer",sourceUrl:"https://seller.example/davidoff",confidence:"Medium",evidenceDate:"2026-08-05",notes:"Exact retail listing only.",comparables:[{title:"Seller — Davidoff Chefs Edition Robusto",url:"https://seller.example/davidoff",unitPrice:45,kind:"Retail replacement",notes:"Exact cigar"}]});assert.deepEqual(valuationRetailLead(research),{seller:"seller.example",sellerType:"Specialty dealer",title:"Seller — Davidoff Chefs Edition Robusto",url:"https://seller.example/davidoff",availability:"Unknown",askingPrice:45,unitPrice:45,notes:"Exact-cigar retail evidence from valuation research. Confirm current price, stock, shipping, and release details with the seller."})});
test("one asking price never becomes an aftermarket value",()=>{const result=ValuationResearchSchema.parse({replacementValue:25,marketValue:null,marketEvidenceType:"Observed asking price",askingPrice:40,askingPriceSource:"Specialty dealer",askingPriceSourceUrl:"https://example.com/ask",source:"Specialty dealer",sourceUrl:"https://example.com/ask",confidence:"Low",evidenceDate:"2026-07-22",notes:"Only one exact secondary listing.",comparables:[{title:"Exact retail",url:"https://example.com/retail",unitPrice:25,kind:"Retail replacement",notes:"Per cigar"},{title:"Exact listing",url:"https://example.com/ask",unitPrice:40,kind:"Secondary asking price",notes:"Asking price only"}]});assert.equal(result.marketValue,null);assert.equal(result.askingPrice,40)});
test("an estimated range requires two independent secondary comparables",()=>assert.equal(ValuationResearchSchema.safeParse({replacementValue:25,marketValue:40,marketEvidenceType:"Estimated market range",marketRangeLow:35,marketRangeHigh:45,source:"One listing",sourceUrl:"https://example.com/ask",confidence:"Medium",evidenceDate:"2026-07-22",notes:"Only one signal.",comparables:[{title:"Exact retail",url:"https://example.com/retail",unitPrice:25,kind:"Retail replacement",notes:"Per cigar"},{title:"Listing",url:"https://example.com/ask",unitPrice:40,kind:"Secondary asking price",notes:"One signal"}]}).success,false));
test("New World retail consensus requires two exact retailer listings",()=>{
  const evidence={replacementValue:30,marketValue:32,marketEvidenceType:"Retail consensus value",marketRangeLow:30,marketRangeHigh:34,askingPrice:null,askingPriceSource:"",askingPriceSourceUrl:"",lastSaleValue:null,lastSaleDate:null,lastSaleVenue:null,lastSaleSourceUrl:null,source:"Exact retailers",sourceUrl:"https://example.com/one",confidence:"Medium",evidenceDate:"2026-07-29",notes:"Two exact current retail listings.",comparables:[{title:"Retailer one",url:"https://example.com/one",unitPrice:30,kind:"Retail replacement",notes:"Exact cigar"},{title:"Retailer two",url:"https://example.com/two",unitPrice:34,kind:"Retail replacement",notes:"Exact cigar"}]};
  assert.equal(ValuationResearchSchema.safeParse(evidence).success,true);
  assert.equal(ValuationResearchSchema.safeParse({...evidence,comparables:evidence.comparables.slice(0,1)}).success,false);
});

const completeDraft = {
  replacementValue: 22.7,
  marketValue: null,
  marketEvidenceType: "Insufficient evidence",
  marketRangeLow: null,
  marketRangeHigh: null,
  askingPrice: null,
  askingPriceSource: "",
  askingPriceSourceUrl: "",
  lastSaleValue: null,
  lastSaleDate: null,
  lastSaleVenue: null,
  lastSaleSourceUrl: null,
  source: "Retailer",
  sourceUrl: "https://example.com/cigar",
  confidence: "Medium",
  evidenceDate: "2026-07-23",
  notes: "Current retailer evidence.",
  comparables: [{ title:"Exact retail", url:"https://example.com/cigar", unitPrice:22.7, kind:"Retail replacement", notes:"Per cigar" }],
} as const;

test("valuation research parsing accepts a complete structured valuation", () => {
  assert.deepEqual(parseValuationResearch(JSON.stringify(completeDraft)), completeDraft);
});

test("mismatched retail replacement is safely omitted while traceable comparables remain reviewable",()=>{
  const result=parseValuationResearch(JSON.stringify({...completeDraft,replacementValue:30,comparables:[{...completeDraft.comparables[0],unitPrice:22.7}]}));
  assert.equal(result.replacementValue,null);
  assert.equal(result.comparables[0].unitPrice,22.7);
  assert.match(result.notes,/Retail replacement omitted/);
});

test("other evidence-integrity failures use collector-facing language instead of raw schema JSON",()=>{
  assert.throws(()=>parseValuationResearch(JSON.stringify({...completeDraft,marketEvidenceType:"Verified completed sale",lastSaleValue:null,lastSaleDate:null,lastSaleSourceUrl:null})),/No value was saved/);
});

test("valuation research parsing turns truncated output into a useful retry message", () => {
  assert.throws(
    () => parseValuationResearch('{"replacementValue":22.7,"notes":"cut off'),
    /response was incomplete/i,
  );
});

test("valuation research parsing hides raw malformed JSON errors", () => {
  assert.throws(
    () => parseValuationResearch('{"replacementValue":22.7 "notes":"missing comma"}'),
    /response was incomplete/i,
  );
});

test("a whole-collection price cannot be stored as one cigar's retail replacement", () => {
  assert.equal(ValuationResearchSchema.safeParse({
    ...completeDraft,
    replacementValue: 6500,
    comparables: [{ title:"13-cigar collection", url:"https://example.com/collection", unitPrice:500, kind:"Retail replacement", notes:"Whole set normalized evenly" }],
  }).success, false);
});

test("research instructions prohibit mixed-set allocation", () => {
  const source=readFileSync(new URL("../lib/valuation-research.ts",import.meta.url),"utf8");
  assert.match(source,/Never divide, average, normalize, or allocate the price of a mixed collection/);
  assert.match(source,/every cigar in that box is the same exact cigar/);
  assert.match(source,/Collection components require exact individual-cigar evidence/);
});

test("retailer direct-page instruction is not redundantly repeated",()=>{
  const source=readFileSync(new URL("../lib/valuation-research.ts",import.meta.url),"utf8");
  assert.equal(source.match(/For every retailer comparable, use the direct product page/g)?.length,1);
});

test("valuation research never treats owned quantity as original packaging", () => {
  const source=readFileSync(new URL("../lib/valuation-research.ts",import.meta.url),"utf8");
  assert.match(source,/current owned quantity is inventory balance only/);
  assert.match(source,/Never treat it as an original box count/);
  assert.match(source,/residual humidor value separately/);
  assert.match(source,/completed-result archives from established European auction houses/);
  assert.match(source,/Confirm whether buyer's premium is included/);
  assert.match(source,/For New World cigars/);
  assert.match(source,/never treat it as a sale/i);
  assert.match(source,/at least two independent exact-identity secondary-market signals/);
  assert.match(source,/Insufficient evidence/);
  assert.match(source,/attempt<2/);
  assert.match(source,/max_output_tokens:3200/);
});
