import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake=readFileSync(new URL("../components/photo-inventory-intake.tsx",import.meta.url),"utf8");
const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");

test("every matching Vault search record exposes its exact full editor",()=>{
  assert.match(intake,/Edit all details/);
  assert.match(intake,/vaultSearch=\$\{encodeURIComponent\(item\.inventoryId\)\}/);
  assert.match(intake,/edit=\$\{encodeURIComponent\(item\.inventoryId\)\}/);
  assert.match(intake,/focus=all#inventory-editor/);
});

test("same-page edit navigation synchronizes the selected exact record into the editor",()=>{
  assert.match(manager,/useEffect\(\(\) => \{\s*if \(!initialEditId\) return;/);
  assert.match(manager,/initialItems\.find\(\(item\) => item\.inventoryId === initialEditId\)/);
  assert.match(manager,/setEditing\(requested\)/);
  assert.match(manager,/setEditMode\(initialEditMode\)/);
  assert.match(manager,/\[initialEditId, initialEditMode, initialItems\]/);
});

test("a saved edit returns directly to the exact record instead of a blank add-lot form",()=>{
  assert.match(manager, /if\(isEdit\)window\.location\.assign\(`\/inventory\/\$\{encodeURIComponent\(savedId\)\}\?saved=inventory`\)/);
});
