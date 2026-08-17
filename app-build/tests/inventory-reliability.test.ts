import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("single-lot creation cannot overwrite an existing inventory reference",()=>{
  const route=readFileSync(new URL("../app/api/inventory/route.ts",import.meta.url),"utf8");
  const userData=readFileSync(new URL("../lib/user-data.ts",import.meta.url),"utf8");
  assert.match(route,/find\(item=>item\.inventoryId===draft\.inventoryId\)/);
  assert.match(route,/createOwnedRecords\(\[/);
  assert.match(route,/This submission was already used for a different inventory entry/);
  assert.match(userData,/from\("vault_records"\)\.insert/);
  assert.match(userData,/error\.code==="23505"/);
  assert.match(userData,/createOwnedRecords/);
});

test("inventory updates cannot silently create a missing record",()=>{
  const route=readFileSync(new URL("../app/api/inventory/[inventoryId]/route.ts",import.meta.url),"utf8");
  assert.match(route,/if \(!existing\).*status: 404/);
  assert.match(route,/Refresh your Vault before trying again/);
  assert.match(route,/saveOwnedRecordIfUnchanged\("inventory", inventoryId, item, expectedRevision, normalizeInventory\)/);
});

test("manual intake generates references and offers verified collection choices",()=>{
  const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/payload\.submissionId=submissionId/);
  assert.doesNotMatch(manager,/<span>Inventory reference<\/span>/);
  assert.match(manager,/<input name="inventoryId" type="hidden"/);
  assert.match(manager,/Collection membership/);
  assert.match(manager,/Standalone cigar \/ not assigned/);
  assert.match(manager,/clearableFields/);
  assert.match(manager,/const formElement = event\.currentTarget/);
  assert.match(manager,/formElement\.reset\(\)/);
  assert.match(manager,/delete payload\[key as keyof typeof payload\]/);
  assert.match(manager,/saved to your private Vault/);
  assert.doesNotMatch(manager,/saved and synchronized/);
});

test("photo-assisted intake attaches its primary evidence after approval",()=>{
  const intake=readFileSync(new URL("../components/photo-inventory-intake.tsx",import.meta.url),"utf8");
  assert.match(intake,/draftPhotos=useRef/);
  assert.match(intake,/primary photo will attach automatically when approved/);
  assert.match(intake,/encodeURIComponent\(item\.inventoryId\).*\/photos/);
  assert.match(intake,/still need to be attached from the saved record/);
  assert.match(intake,/result\.data\.valuationStatus/);
});

test("quantity-changing activity saves the ledger and inventory atomically",()=>{
  const route=readFileSync(new URL("../app/api/activities/route.ts",import.meta.url),"utf8");
  const manager=readFileSync(new URL("../components/activity-manager.tsx",import.meta.url),"utf8");
  assert.match(route,/importOwnedRecords\(\[\{kind:"activities"/);
  assert.match(route,/\{kind:"inventory"/);
  assert.match(route,/synchronized:true/);
  assert.match(manager,/Vault balance is now/);
  assert.match(manager,/across your signed-in devices/);
  assert.doesNotMatch(manager,/updated in Smartsheet/);
});
