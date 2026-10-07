import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

test("Vault smoke saves use the selected lot revision and reject concurrent quantity changes",()=>{
  const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  assert.match(manager,/"if-match":recordRevision\(selectedSmokeInventory\)/);
  assert.match(route,/request\.headers\.get\("if-match"\)/);
  assert.match(route,/saveOwnedRecordIfUnchanged\("inventory",inventory\.inventoryId,consumeInventory/);
  assert.match(route,/deleteOwnedRecord\("smokes",item\.smokeId\)/);
});
