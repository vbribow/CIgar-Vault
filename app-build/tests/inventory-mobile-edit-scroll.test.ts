import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");

test("editing one inventory lot removes the oversized Vault browser from mobile layout",()=>{
  assert.match(manager,/className="inventoryBrowseWorkspace" hidden=\{editorOnly\|\|Boolean\(editing\|\|draft\)\}/);
  assert.match(manager,/id="inventory-editor"/);
  assert.match(manager,/Cancel/);
  assert.match(manager,/editorOnly\?<a className="button secondary" href="#record-top">Close editor<\/a>/);
});

test("the registered storage selector receives focus after opening its focused editor",()=>{
  assert.match(manager,/select\[name="storageLocationId"\]/);
  assert.doesNotMatch(manager,/input\[name="storageLocationId"\]/);
});
