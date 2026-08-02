import assert from "node:assert/strict";
import test from "node:test";
import { blendResearchCoverage, blendResearchState } from "../lib/blend-research-coverage";

test("blend coverage requires all exact fields and a product source",()=>{
  const complete={catalogId:"CAT-1",brand:"Example",line:"Reserva",vitola:"Toro",wrapper:"Habano",wrapperOrigin:"Ecuador",binder:"Leaf",binderOrigin:"Nicaragua",filler:"Blend",fillerOrigins:"Nicaragua",strength:"Medium",sourceUrl:"https://example.com/toro"};
  assert.equal(blendResearchState(complete),"Source-backed");
  assert.equal(blendResearchState({...complete,sourceUrl:undefined}),"Needs product source");
  assert.equal(blendResearchState({...complete,binder:undefined}),"Partial evidence");
  assert.equal(blendResearchState({catalogId:"CAT-2",brand:"Example",line:"Reserva",vitola:"Robusto"}),"Queued for research");
});

test("every known cigar receives one coverage state",()=>{
  const coverage=blendResearchCoverage([
    {catalogId:"CAT-1",brand:"Example",line:"Reserva",vitola:"Toro",wrapper:"Habano"},
    {catalogId:"CAT-2",brand:"Example",line:"Reserva",vitola:"Robusto"},
  ]);
  assert.equal(coverage.total,2);
  assert.equal(coverage.needsSource,1);
  assert.equal(coverage.queued,1);
  assert.equal(coverage.records.length,coverage.total);
});
