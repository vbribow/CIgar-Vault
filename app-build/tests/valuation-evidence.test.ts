import assert from "node:assert/strict";
import test from "node:test";
import { claimsUnverifiedCompletedSale, completedSaleLabel, isVerifiedCompletedSale, marketAskingPriceLabel, marketEvidenceType, marketRangeText, strongestEvidenceUrl } from "../lib/valuation-evidence";

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

test("a documented lack of sale evidence is not misread as a sale claim",()=>{
  const insufficient = {
    ...base,
    replacementValue:75,
    marketEvidenceType:"Insufficient evidence" as const,
    notes:"No direct completed-sale proof was found.",
  };
  assert.equal(claimsUnverifiedCompletedSale(insufficient),false);
  assert.equal(completedSaleLabel(insufficient),"No verified completed sale");
  assert.equal(marketEvidenceType(insufficient),"Insufficient evidence");
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

test("an unsold listing has one plain universal market-asking label",()=>{
  assert.equal(marketAskingPriceLabel,"Market asking price — no confirmed sale");
  assert.notEqual(marketAskingPriceLabel,"Market value");
  assert.notEqual(marketAskingPriceLabel,"Verified completed sale");
});

test("legacy concatenated evidence text produces one navigable strongest-source URL",()=>{
  assert.equal(strongestEvidenceUrl("https://www.onlinecigarauctions.com/%20(sold-lots%20pages\\)%20and%20https://www.havahavana.com/products/juan-lopez-seleccion-no-2"),"https://www.havahavana.com/products/juan-lopez-seleccion-no-2");
  assert.equal(strongestEvidenceUrl("https://example.com/direct"),"https://example.com/direct");
});
