import assert from"node:assert/strict";import test from"node:test";import{betaSummary,type BetaCollector}from"../lib/beta-onboarding";
const item=(stage:BetaCollector["stage"],id:string):BetaCollector=>({id,name:id,email:`${id}@example.com`,stage,createdAt:"2026-07-21",updatedAt:"2026-07-21"});
test("summarizes the founder beta pipeline and remaining seats",()=>{const result=betaSummary([item("Prospect","a"),item("Invited","b"),item("Imported","c"),item("Activated","d")]);assert.equal(result.total,4);assert.equal(result.activated,1);assert.equal(result.founderSeatsRemaining,24)});
test("founder seats never become negative",()=>{assert.equal(betaSummary(Array.from({length:30},(_,i)=>item("Activated",String(i)))).founderSeatsRemaining,0)});
