import assert from "node:assert/strict";
import test from "node:test";
import { SmokingLogSchema, ValuationSchema } from "../lib/records-model";
test("smoking log accepts a valid dated score",()=>assert.equal(SmokingLogSchema.safeParse({smokeId:"SMK-1",inventoryId:"INV-1",dateSmoked:"2026-07-21",overall:95}).success,true));
test("smoking log rejects an invalid calendar date",()=>assert.equal(SmokingLogSchema.safeParse({smokeId:"SMK-1",inventoryId:"INV-1",dateSmoked:"today"}).success,false));
test("valuation rejects negative values",()=>assert.equal(ValuationSchema.safeParse({valuationId:"VAL-1",inventoryId:"INV-1",valuationDate:"2026-07-21",marketValue:-1}).success,false));
test("valuation accepts traceable completed-sale evidence",()=>assert.equal(ValuationSchema.safeParse({valuationId:"VAL-2",inventoryId:"INV-1",valuationDate:"2026-07-22",lastSaleValue:52,lastSaleDate:"2026-07-01",lastSaleVenue:"Example Auctions",lastSaleSourceUrl:"https://example.com/sold"}).success,true));
