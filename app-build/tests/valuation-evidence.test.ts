import assert from "node:assert/strict";
import test from "node:test";
import { claimsUnverifiedCompletedSale, completedSaleLabel, isVerifiedCompletedSale, marketEvidenceType, marketRangeText } from "../lib/valuation-evidence";

const base = { valuationId:"V", inventoryId:"I", valuationDate:"2026-07-24" };

test("valuation evidence preserves the strongest proven market level",()=>{
  assert.equal(marketEvidenceType({...base,askingPrice:40,askingPriceSourceUrl:"https://example.com/ask"}),"Observed asking price");
  assert.equal(marketEvidenceType({...base,marketValue:45,marketRangeLow:40,marketRangeHigh:50}),"Estimated market range");
  assert.equal(marketEvidenceType({...base,lastSaleValue:47,lastSaleDate:"2026-07-01",lastSaleSourceUrl:"https://example.com/sold"}),"Verified completed sale");
  assert.equal(marketEvidenceType(base),"Insufficient evidence");
});

test("market ranges remain ranges rather than false point precision",()=>{
  assert.equal(marketRangeText({...base,marketRangeLow:40,marketRangeHigh:55}),"$40.00–$55.00");
  assert.equal(marketRangeText(base),undefined);
});

test("completed-sale wording alone never confers verified status",()=>{
  const sourceLabelOnly = {...base,marketValue:45,source:"Online auction — completed sale"};
  assert.equal(isVerifiedCompletedSale(sourceLabelOnly),false);
  assert.equal(claimsUnverifiedCompletedSale(sourceLabelOnly),true);
  assert.equal(completedSaleLabel(sourceLabelOnly),"Legacy market value — completed sale unverified");
  assert.equal(marketEvidenceType(sourceLabelOnly),"Estimated market range");
});

test("partial completed-sale fields remain legacy and unverified",()=>{
  const valueOnly = {...base,lastSaleValue:47,marketEvidenceType:"Verified completed sale" as const};
  const valueAndDate = {...valueOnly,lastSaleDate:"2026-07-01"};
  const valueAndUrl = {...valueOnly,lastSaleSourceUrl:"https://example.com/sold"};
  for (const record of [valueOnly,valueAndDate,valueAndUrl]) {
    assert.equal(isVerifiedCompletedSale(record),false);
    assert.equal(claimsUnverifiedCompletedSale(record),true);
    assert.equal(completedSaleLabel(record),"Legacy market value — completed sale unverified");
    assert.notEqual(marketEvidenceType(record),"Verified completed sale");
  }
});

test("a completed sale requires value, sale date, and direct sold-lot URL",()=>{
  const verified = {...base,lastSaleValue:47,lastSaleDate:"2026-07-01",lastSaleSourceUrl:"https://example.com/sold"};
  assert.equal(isVerifiedCompletedSale(verified),true);
  assert.equal(completedSaleLabel(verified),"Verified completed sale");
  assert.equal(marketEvidenceType(verified),"Verified completed sale");
});
