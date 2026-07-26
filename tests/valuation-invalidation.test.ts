import test from "node:test";
import assert from "node:assert/strict";
import { ValuationSchema } from "../lib/records-model";

test("valuation invalidation preserves a reason and timestamp",()=>{
  const value=ValuationSchema.parse({
    valuationId:"VAL-1",inventoryId:"INV-1",valuationDate:"2026-07-24",
    replacementValue:6500,invalidatedAt:"2026-07-26T12:00:00.000Z",
    invalidationReason:"Whole 13-cigar collection price was incorrectly attached to one component.",
  });
  assert.equal(value.invalidatedAt,"2026-07-26T12:00:00.000Z");
});

test("valuation invalidation cannot be recorded without an explanation",()=>{
  assert.throws(()=>ValuationSchema.parse({
    valuationId:"VAL-1",inventoryId:"INV-1",valuationDate:"2026-07-24",
    invalidatedAt:"2026-07-26T12:00:00.000Z",
  }));
});
