import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cigarReferencePhoto } from "../lib/cigar-reference-photo";
import type { CatalogCigar, InventoryItem } from "../lib/types";

const item: InventoryItem = { inventoryId:"INV-1",catalogId:"CAT-1",brand:"Example",line:"Reserva",vitola:"Toro",vintage:2026,photoLink:"private://collector/custom.jpg" };
const exact: CatalogCigar = { catalogId:"CAT-1",brand:"Example",line:"Reserva",vitola:"Toro",releaseYear:2026,referenceImageUrl:"https://example.com/toro.jpg",referenceImageSourceUrl:"https://example.com/reserva-toro",referenceImageSourceName:"Example official product page" };

test("an attributed exact cigar and release receives its catalog reference photo",()=>{
  assert.deepEqual(cigarReferencePhoto(item,[exact]),{imageUrl:"https://example.com/toro.jpg",sourceUrl:"https://example.com/reserva-toro",sourceName:"Example official product page",catalogId:"CAT-1"});
  assert.equal(item.photoLink,"private://collector/custom.jpg");
});

test("nearby vitolas, releases, and unattributed images are never substituted",()=>{
  assert.equal(cigarReferencePhoto(item,[{...exact,vitola:"Robusto"}]),undefined);
  assert.equal(cigarReferencePhoto(item,[{...exact,releaseYear:2025}]),undefined);
  assert.equal(cigarReferencePhoto(item,[{...exact,referenceImageSourceUrl:undefined}]),undefined);
  assert.equal(cigarReferencePhoto(item,[{...exact,referenceImageUrl:"http://example.com/toro.jpg"}]),undefined);
});

test("record detail keeps catalog reference photography separate from custom photo tools",()=>{
  const page=readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx",import.meta.url),"utf8");
  const manager=readFileSync(new URL("../components/photo-manager.tsx",import.meta.url),"utf8");
  assert.match(page,/CigarReferencePhoto/);
  assert.match(manager,/Photos & documents/);
  assert.match(manager,/Choose or take photo/);
});
