import assert from "node:assert/strict";
import test from "node:test";
import { exactCatalogMatch, inventoryOrigin } from "../lib/inventory-origin";
import type { CatalogCigar, InventoryItem } from "../lib/types";

const item: InventoryItem={inventoryId:"INV-1",brand:"Arturo Fuente",line:"OpusX",vitola:"PerfecXion No. 4",vintage:2025};

test("origin is reused immediately from an exact cigar and compatible release",()=>{
  const catalog:CatalogCigar[]=[{catalogId:"CAT-1",brand:item.brand,line:item.line,vitola:item.vitola,releaseYear:2025,country:"Dominican Republic",sourceUrl:"https://example.com/opusx"}];
  assert.equal(inventoryOrigin(item,catalog).country,"Dominican Republic");
  assert.equal(exactCatalogMatch(item,catalog)?.catalogId,"CAT-1");
});
test("nearby vitolas and conflicting release years cannot populate origin",()=>{
  const catalog:CatalogCigar[]=[{catalogId:"V",brand:item.brand,line:item.line,vitola:"Robusto",releaseYear:2025,country:"Dominican Republic"},{catalogId:"Y",brand:item.brand,line:item.line,vitola:item.vitola,releaseYear:2026,country:"Dominican Republic"}];
  assert.equal(inventoryOrigin(item,catalog).status,"Research needed");
  assert.equal(exactCatalogMatch(item,catalog),undefined);
});
test("conflicting exact origin evidence stays pending",()=>{
  const catalog:CatalogCigar[]=[{catalogId:"A",brand:item.brand,line:item.line,vitola:item.vitola,country:"Dominican Republic"},{catalogId:"B",brand:item.brand,line:item.line,vitola:item.vitola,country:"Nicaragua"}];
  assert.equal(inventoryOrigin({...item,vintage:undefined},catalog).status,"Research needed");
  assert.equal(exactCatalogMatch({...item,vintage:undefined},catalog),undefined);
});
