import assert from "node:assert/strict";
import test from "node:test";
import { marketEvidenceType, marketRangeText } from "../lib/valuation-evidence";

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
