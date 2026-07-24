import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import test from"node:test";

test("Vault presents separate browse, audit, and valuable collection workspaces",()=>{
 const page=readFileSync(new URL("../app/inventory/page.tsx",import.meta.url),"utf8");
 assert.match(page,/Browse Vault/);
 assert.match(page,/href="\/inventory-count"/);
 assert.match(page,/Audit My Inventory/);
 assert.match(page,/href="\/collections"/);
 assert.match(page,/Valuable Collections/);
 assert.match(page,/id="inventory-records"/);
 assert.doesNotMatch(page,/Confirm my collection/);
});
