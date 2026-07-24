import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manager=readFileSync(new URL("../components/humidor-manager.tsx",import.meta.url),"utf8");
const profileSource=readFileSync(new URL("../lib/climate-intelligence.ts",import.meta.url),"utf8");
const dashboard=readFileSync(new URL("../components/climate-alert-dashboard.tsx",import.meta.url),"utf8");
const humidorDetail=readFileSync(new URL("../app/humidors/[humidorId]/page.tsx",import.meta.url),"utf8");
const cigarDetail=readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx",import.meta.url),"utf8");

test("humidor configuration offers evidence-based profiles without removing collector control",()=>{
  for(const profile of ["New World","Habanos","Mixed collection","Aging cellar","Custom"])assert.match(profileSource,new RegExp(profile));
  assert.match(manager,/Selecting a profile fills the evidence-based starting ranges/);
  assert.match(manager,/You remain in control/);
  assert.match(manager,/applyClimateProfile/);
});

test("climate command center presents sustained exposure and collection risk",()=>{
  assert.match(dashboard,/Sustained exposure/);
  assert.match(dashboard,/Collection at risk/);
  assert.match(dashboard,/Why it matters/);
  assert.match(dashboard,/intelligence\.action/);
});

test("humidor and cigar records expose climate stewardship context",()=>{
  assert.match(humidorDetail,/Estimated from observed readings/);
  assert.match(humidorDetail,/Exposure estimates cap gaps between readings/);
  assert.match(cigarDetail,/Climate stewardship/);
  assert.match(cigarDetail,/Observed exposure/);
  assert.match(cigarDetail,/Aging checkpoint/);
  assert.match(cigarDetail,/Climate history qualifies the aging estimate/);
  assert.match(cigarDetail,/Open its climate history/);
});
