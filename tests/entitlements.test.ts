import assert from"node:assert/strict";import test from"node:test";import{collectorProfile,effectivePlan,hasEntitlement,normalizePlan,upgradeSuggestion}from"../lib/entitlements";
test("founders retain the complete platform",()=>{for(const feature of ["unlimited-inventory","professional-ratings","climate-sensors","automations","concierge-support"] as const)assert.equal(hasEntitlement("founder",feature),true)});test("unknown plans fail safely to free",()=>{assert.equal(normalizePlan("legacy-mystery"),"free")});test("upgrade suggestions respond to actual usage",()=>{assert.equal(upgradeSuggestion("free","inventory",19),undefined);assert.equal(upgradeSuggestion("free","inventory",20)?.target,"collector");assert.equal(upgradeSuggestion("collector","sensors")?.target,"pro");assert.equal(upgradeSuggestion("founder","ratings"),undefined)});
test("high-end collection signals receive stewardship recommendations",()=>{assert.equal(collectorProfile({portfolioValue:120000}),"estate");const suggestion=upgradeSuggestion("pro","reports",0,{portfolioValue:120000});assert.equal(suggestion?.target,"concierge");assert.match(suggestion?.detail||"",/white-glove/)});
test("paid plans fail closed when billing is not active or trialing",()=>{
  assert.equal(effectivePlan("founder","active"),"founder");
  assert.equal(effectivePlan("founder","trialing"),"founder");
  for(const status of ["past_due","canceled","unpaid","incomplete",undefined])assert.equal(effectivePlan("founder",status),"free");
  assert.equal(effectivePlan("free","inactive"),"free");
});
