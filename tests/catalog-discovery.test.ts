import assert from "node:assert/strict";
import test from "node:test";
import { CatalogDiscoverySchema, discoveryId, groupCatalogDiscoveries, newCatalogDiscoveries } from "../lib/catalog-discovery";

const candidate={brand:"Example Cigars",line:"New Blend",vitola:"Toro",country:"Nicaragua",factory:"Example Factory",brandOwner:"Example Holdings",blender:"Example Blender",wrapper:"Habano",wrapperOrigin:"Ecuador",binder:"Nicaraguan",binderOrigin:"Nicaragua",filler:"Nicaraguan blend",fillerOrigins:"Nicaragua",dimensions:"6 × 52",strength:"Medium",packaging:"Box of 20",releaseYear:"2026",edition:"Regular production",entityType:"Brand owner" as const,sourceUrl:"https://example.com/new-blend",sourceTitle:"Official release",evidenceDate:"2026-07-21",notes:"New release",confidence:"High" as const};
test("catalog discovery validates sourced exact cigar combinations",()=>{assert.equal(CatalogDiscoverySchema.parse({discoveries:[candidate]}).discoveries.length,1)});
test("catalog discovery removes existing and duplicate combinations",()=>{const result=newCatalogDiscoveries([candidate,{...candidate,sourceUrl:"https://example.com/duplicate"},{...candidate,vitola:"Robusto"}],[{catalogId:"CAT-1",brand:"Example Cigars",line:"New Blend",vitola:"Toro",releaseYear:"2026"}]);assert.deepEqual(result.map(item=>item.vitola),["Robusto"])});
test("discovery ids are stable",()=>{assert.equal(discoveryId(candidate),discoveryId({brand:candidate.brand,line:candidate.line,vitola:candidate.vitola,releaseYear:candidate.releaseYear}))});
test("discovery review groups every vitola in a release",()=>{
  const groups=groupCatalogDiscoveries([
    {catalogId:"DISC-1",brand:"Example Cigars",line:"New Blend",vitola:"Toro"},
    {catalogId:"DISC-2",brand:"Example Cigars",line:"New Blend",vitola:"Robusto"},
    {catalogId:"DISC-3",brand:"Another Brand",line:"Launch Edition",vitola:"Toro"},
  ]);
  assert.equal(groups.length,2);
  assert.deepEqual(groups.find(group=>group.brand==="Example Cigars")?.items.map(item=>item.vitola),["Robusto","Toro"]);
});
