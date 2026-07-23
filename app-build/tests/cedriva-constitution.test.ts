import test from "node:test";
import assert from "node:assert/strict";
import { cedrivaPrinciples,constitutionalDecision } from "../lib/cedriva-constitution";
test("Cedriva decisions answer all four constitutional questions",()=>{assert.equal(cedrivaPrinciples.length,4);assert.deepEqual(constitutionalDecision({educates:true,buildsTrust:true,strengthensCommunity:true,preservesCulture:true}),{passed:4,total:4,approved:true,outcome:"Proceed"})});
test("a feature that fails a constitutional commitment must be rethought",()=>assert.equal(constitutionalDecision({educates:true,buildsTrust:false,strengthensCommunity:true,preservesCulture:true}).outcome,"Rethink"));
