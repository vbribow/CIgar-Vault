import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const unifiedStory=readFileSync(new URL("../app/cigars/[identityId]/page.tsx",import.meta.url),"utf8");
const inventoryDetail=readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx",import.meta.url),"utf8");

test("presentation assets redirect away from the cigar-specific Unified Story",()=>{
  assert.match(unifiedStory,/inventoryCollectionRelationships\(inventory,collections\)/);
  assert.match(unifiedStory,/relationship\?\.kind==="presentation"/);
  assert.match(unifiedStory,/redirect\(`\/collections\//);
  assert.match(unifiedStory,/isPresentationInventoryRecord\(representative,collections\)/);
});

test("inventory presents a collection destination instead of a cigar-story button for presentation assets",()=>{
  assert.match(inventoryDetail,/isPresentationAsset&&collectionRelationship\.collection/);
  assert.match(inventoryDetail,/Open collection record →/);
  assert.match(inventoryDetail,/Tracked separately from the collection’s cigar components/);
});
