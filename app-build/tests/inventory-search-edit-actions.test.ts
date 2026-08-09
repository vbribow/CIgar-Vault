import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake=readFileSync(new URL("../components/photo-inventory-intake.tsx",import.meta.url),"utf8");

test("every matching Vault search record exposes its exact full editor",()=>{
  assert.match(intake,/Edit all details/);
  assert.match(intake,/vaultSearch=\$\{encodeURIComponent\(item\.inventoryId\)\}/);
  assert.match(intake,/edit=\$\{encodeURIComponent\(item\.inventoryId\)\}/);
  assert.match(intake,/focus=all#inventory-editor/);
});
