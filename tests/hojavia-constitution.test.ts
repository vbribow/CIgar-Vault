import test from "node:test";
import assert from "node:assert/strict";
import { hojaviaPrinciples,constitutionalDecision } from "../lib/hojavia-constitution";
test("Hojavía decisions answer all four constitutional questions",()=>{assert.equal(hojaviaPrinciples.length,4);assert.deepEqual(constitutionalDecision({educates:true,buildsTrust:true,strengthensCommunity:true,preservesCulture:true}),{passed:4,total:4,approved:true,outcome:"Proceed"})});
test("a feature that fails a constitutional commitment must be rethought",()=>assert.equal(constitutionalDecision({educates:true,buildsTrust:false,strengthensCommunity:true,preservesCulture:true}).outcome,"Rethink"));
