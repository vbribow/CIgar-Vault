import assert from "node:assert/strict";
import test from "node:test";
import { SmokingLogCreateSchema, SmokingLogSchema, ValuationSchema } from "../lib/records-model";
test("smoking log accepts a valid dated score",()=>assert.equal(SmokingLogSchema.safeParse({smokeId:"SMK-1",inventoryId:"INV-1",dateSmoked:"2026-07-21",overall:95}).success,true));
test("smoking log rejects an invalid calendar date",()=>assert.equal(SmokingLogSchema.safeParse({smokeId:"SMK-1",inventoryId:"INV-1",dateSmoked:"today"}).success,false));
test("manual smoking records require the cigar identity",()=>{assert.equal(SmokingLogSchema.safeParse({smokeId:"SMK-2",inventoryId:"MANUAL",dateSmoked:"2026-07-21"}).success,false);assert.equal(SmokingLogSchema.safeParse({smokeId:"SMK-2",inventoryId:"MANUAL",cigarName:"Casa Fuente Double Corona",dateSmoked:"2026-07-21",overall:0,flavor:"Cedar, Cream, Coffee",strength:"Medium"}).success,true)});
test("collector smoke input omits the server-owned ID",()=>{assert.equal(SmokingLogCreateSchema.safeParse({inventoryId:"INV-0053",dateSmoked:"2026-07-27"}).success,true);assert.equal(SmokingLogCreateSchema.safeParse({smokeId:"SMK-OVERWRITE",inventoryId:"INV-0053",dateSmoked:"2026-07-27"}).success,false)});
test("optional construction and burn ratings use the approved structured choices",()=>{
  assert.equal(SmokingLogCreateSchema.safeParse({inventoryId:"INV-0053",dateSmoked:"2026-07-27",construction:"Very good",burn:"Minor touch-up"}).success,true);
  assert.equal(SmokingLogCreateSchema.safeParse({inventoryId:"INV-0053",dateSmoked:"2026-07-27"}).success,true);
  assert.equal(SmokingLogCreateSchema.safeParse({inventoryId:"INV-0053",dateSmoked:"2026-07-27",construction:"Tasted earthy"}).success,false);
  assert.equal(SmokingLogCreateSchema.safeParse({inventoryId:"INV-0053",dateSmoked:"2026-07-27",burn:"Medium-full"}).success,false);
});
test("legacy smoking records preserve blank or historical construction text",()=>{
  assert.equal(SmokingLogSchema.safeParse({smokeId:"LEGACY",inventoryId:"INV-1",dateSmoked:"2026-01-01",construction:"Needed one correction before the midpoint"}).success,true);
  assert.equal(SmokingLogSchema.safeParse({smokeId:"LEGACY-2",inventoryId:"INV-1",dateSmoked:"2026-01-02"}).success,true);
});
test("valuation rejects negative values",()=>assert.equal(ValuationSchema.safeParse({valuationId:"VAL-1",inventoryId:"INV-1",valuationDate:"2026-07-21",marketValue:-1}).success,false));
test("valuation accepts traceable completed-sale evidence",()=>assert.equal(ValuationSchema.safeParse({valuationId:"VAL-2",inventoryId:"INV-1",valuationDate:"2026-07-22",lastSaleValue:52,lastSaleDate:"2026-07-01",lastSaleVenue:"Example Auctions",lastSaleSourceUrl:"https://example.com/sold"}).success,true));
test("valuation refuses to turn one asking price into market value",()=>assert.equal(ValuationSchema.safeParse({valuationId:"VAL-3",inventoryId:"INV-1",valuationDate:"2026-07-22",marketEvidenceType:"Observed asking price",askingPrice:52,askingPriceSourceUrl:"https://example.com/ask",marketValue:52}).success,false));
test("valuation accepts a linked asking price without inventing market value",()=>assert.equal(ValuationSchema.safeParse({valuationId:"VAL-4",inventoryId:"INV-1",valuationDate:"2026-07-22",marketEvidenceType:"Observed asking price",askingPrice:52,askingPriceSource:"Specialty dealer",askingPriceSourceUrl:"https://example.com/ask"}).success,true));
test("valuation requires two comparables for an estimated range",()=>{assert.equal(ValuationSchema.safeParse({valuationId:"VAL-5",inventoryId:"INV-1",valuationDate:"2026-07-22",marketEvidenceType:"Estimated market range",marketValue:50,marketRangeLow:45,marketRangeHigh:55,comparableCount:1}).success,false);assert.equal(ValuationSchema.safeParse({valuationId:"VAL-6",inventoryId:"INV-1",valuationDate:"2026-07-22",marketEvidenceType:"Estimated market range",marketValue:50,marketRangeLow:45,marketRangeHigh:55,comparableCount:2}).success,true)});
test("retail consensus requires two linked comparables and credible confidence",()=>{
  const evidence={valuationId:"VAL-C",inventoryId:"INV-1",valuationDate:"2026-07-29",marketEvidenceType:"Retail consensus value",marketValue:32,marketRangeLow:30,marketRangeHigh:34,sourceUrl:"https://example.com/exact-cigar",confidence:"Medium"};
  assert.equal(ValuationSchema.safeParse({...evidence,comparableCount:1}).success,false);
  assert.equal(ValuationSchema.safeParse({...evidence,comparableCount:2}).success,true);
});
test("valuation accepts a positive whole-box quantity and rejects fractional boxes",()=>{assert.equal(ValuationSchema.safeParse({valuationId:"VAL-7",inventoryId:"INV-1",valuationDate:"2026-07-24",replacementValue:32,replacementSticksPerBox:10}).success,true);assert.equal(ValuationSchema.safeParse({valuationId:"VAL-8",inventoryId:"INV-1",valuationDate:"2026-07-24",replacementValue:32,replacementSticksPerBox:10.5}).success,false)});
