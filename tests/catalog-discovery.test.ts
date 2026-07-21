import assert from "node:assert/strict";
import test from "node:test";
import { CatalogDiscoverySchema, discoveryId, newCatalogDiscoveries } from "../lib/catalog-discovery";

const candidate={brand:"Example Cigars",line:"New Blend",vitola:"Toro",country:"Nicaragua",sourceUrl:"https://example.com/new-blend",sourceTitle:"Official release",evidenceDate:"2026-07-21",notes:"New release",confidence:"High" as const};
test("catalog discovery validates sourced exact cigar combinations",()=>{assert.equal(CatalogDiscoverySchema.parse({discoveries:[candidate]}).discoveries.length,1)});
test("catalog discovery removes existing and duplicate combinations",()=>{const result=newCatalogDiscoveries([candidate,{...candidate,sourceUrl:"https://example.com/duplicate"},{...candidate,vitola:"Robusto"}],[{catalogId:"CAT-1",brand:"Example Cigars",line:"New Blend",vitola:"Toro"}]);assert.deepEqual(result.map(item=>item.vitola),["Robusto"])});
test("discovery ids are stable",()=>{assert.equal(discoveryId(candidate),discoveryId({brand:candidate.brand,line:candidate.line,vitola:candidate.vitola}))});
