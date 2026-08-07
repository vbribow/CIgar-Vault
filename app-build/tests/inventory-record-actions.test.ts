import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const detail=readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx",import.meta.url),"utf8");
const actions=readFileSync(new URL("../components/inventory-record-actions.tsx",import.meta.url),"utf8");
const route=readFileSync(new URL("../app/api/inventory/[inventoryId]/route.ts",import.meta.url),"utf8");

test("every inventory detail exposes explicit edit and delete actions",()=>{
  assert.match(detail,/InventoryRecordActions/);
  assert.match(actions,/>Edit record</);
  assert.match(actions,/Delete record/);
  assert.match(actions,/window\.confirm/);
  assert.match(actions,/aria-live="polite"/);
});

test("inventory deletion protects newer changes with the exact record revision",()=>{
  assert.match(actions,/"If-Match":recordRevision\(item\)/);
  assert.match(route,/expectedRevision!==recordRevision\(existing\)/);
  assert.match(route,/status:409/);
});
