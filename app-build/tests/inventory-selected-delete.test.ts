import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("a single checked web inventory row offers exact protected deletion",()=>{
  const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/selected\.size===1&&mode!=="mock"/);
  assert.match(manager,/Delete selected record/);
  assert.match(manager,/selected\.size>1.*Select one record at a time to delete/);
  assert.match(manager,/"If-Match": recordRevision\(item\)/);
  assert.match(manager,/setSelected\(\(current\)=>\{const next=new Set\(current\);next\.delete\(item\.inventoryId\)/);
});
