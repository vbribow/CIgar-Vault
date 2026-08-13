import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sharedBrandBoundaries,sharedBrandBoundary } from "../lib/brand-entity-boundaries";

test("Cuban and New World companies sharing a name remain explicit separate entities",()=>{
  assert.equal(sharedBrandBoundary("Cohiba")?.entities.length,3);
  assert.equal(sharedBrandBoundary("Cohiba Red Dot")?.sharedName,"Cohiba");
  assert.deepEqual(sharedBrandBoundary("Montecristo (Dominican)")?.entities.map(item=>item.label),["Montecristo","Montecristo (Dominican)"]);
  for(const name of ["Romeo y Julieta","H. Upmann","Trinidad","Partagás","Hoyo de Monterrey","Bolívar","Fonseca","La Gloria Cubana","El Rey del Mundo","Sancho Panza"])assert.ok(sharedBrandBoundary(name),`${name} must preserve separate Cuban and New World identities`);
  for(const boundary of sharedBrandBoundaries)assert.ok(boundary.entities.some(entity=>/Cuba/.test(entity.market))&&boundary.entities.some(entity=>/New World|Brazil/.test(entity.market)));
});
test("Search all brands visibly warns collectors before assigning shared-name evidence",()=>{
  const component=readFileSync(new URL("../components/manufacturing-truth-directory.tsx",import.meta.url),"utf8");
  assert.match(component,/Shared name · different companies/);
  assert.match(component,/origin, factory, ratings, or catalog records/);
});
