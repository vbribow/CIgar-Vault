import assert from "node:assert/strict";
import test from "node:test";
import { collectionEvidence, evidenceLabel, ratingEvidence, valuationEvidence } from "../lib/trust-evidence";

test("valuation evidence preserves source, date, and confidence",()=>{
  const evidence=valuationEvidence({valuationId:"V1",inventoryId:"I1",valuationDate:"2026-07-23",replacementValue:20,source:"Automated research — retailer",sourceUrl:"https://example.com",confidence:"High"});
  assert.equal(evidence.kind,"AI");
  assert.equal(evidence.confidence,"High");
  assert.match(evidenceLabel(evidence),/2026-07-23/);
});

test("ratings remain editorial evidence rather than collector fact",()=>{
  const evidence=ratingEvidence({ratingId:"R1",inventoryId:"I1",publication:"Cigar Journal",score:94,sourceUrl:"https://example.com/review",matchConfidence:"Medium",createdAt:"2026-07-23T10:00:00.000Z"});
  assert.equal(evidence.kind,"Expert");
  assert.equal(evidence.supports,"Published rating for the matched cigar identity");
});

test("unsourced collection records remain visibly collector statements",()=>{
  const evidence=collectionEvidence({collectionId:"C1",name:"Family Set"});
  assert.equal(evidence.kind,"Community");
  assert.equal(evidence.confidence,"Unrated");
});
