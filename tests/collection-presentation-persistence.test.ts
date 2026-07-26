import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const smartsheet=readFileSync(new URL("../lib/smartsheet.ts",import.meta.url),"utf8");
const collectionRoute=readFileSync(new URL("../app/api/collections/route.ts",import.meta.url),"utf8");

test("Smartsheet presentation linkage has explicit read and write mapping", () => {
  assert.match(smartsheet,/const PRESENTATION_INVENTORY_COLUMN = "Presentation Inventory ID"/);
  assert.match(smartsheet,/presentationInventoryId:v\.get\(PRESENTATION_INVENTORY_COLUMN\)/);
  assert.match(smartsheet,/\[PRESENTATION_INVENTORY_COLUMN,value\.presentationInventoryId\]/);
  assert.match(smartsheet,/if\(value\.presentationInventoryId&&!collectionSheet\.columns\.some/);
});

test("Smartsheet membership updates exclude and unlink the presentation asset", () => {
  assert.match(smartsheet,/const isPresentation=item\.inventoryId===value\.presentationInventoryId/);
  assert.match(smartsheet,/const shouldSelect=!isPresentation&&selected\.has\(item\.inventoryId\)/);
});

test("Supabase saves presentation linkage with the collection and never as cigar membership", () => {
  assert.match(collectionRoute,/\{kind:"collections",recordId:collection\.collectionId,payload:collection\}/);
  assert.match(collectionRoute,/item\.inventoryId===collection\.presentationInventoryId\s*\?\s*undefined/);
  assert.match(collectionRoute,/presentation humidor or case cannot also be saved as a cigar component/);
});
