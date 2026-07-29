import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import test from"node:test";

test("Vault presents separate browse, audit, and valuable collection workspaces",()=>{
 const page=readFileSync(new URL("../app/inventory/page.tsx",import.meta.url),"utf8");
 const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");
 const audit=readFileSync(new URL("../app/collection-health/page.tsx",import.meta.url),"utf8");
 assert.match(page,/Browse Vault/);
 assert.match(page,/href="#inventory-records"/);
 assert.match(page,/Audit My Inventory/);
 assert.match(page,/href="\/collection-health"/);
 assert.match(page,/href="\/collections"/);
 assert.match(page,/Valuable Collections/);
 assert.match(manager,/id="inventory-records"/);
 assert.match(manager,/aria-label="Inventory records and filters"/);
 assert.match(audit,/Audit my inventory/);
 assert.match(audit,/Physical quantity/);
 assert.match(audit,/Production year/);
 assert.match(audit,/Replacement value/);
 assert.match(audit,/Storage location/);
 assert.match(audit,/Provenance/);
 assert.match(audit,/Membership truth/);
 assert.match(audit,/missing=\$\{check\.key\}&active=1#inventory-records/);
 assert.match(page,/initialActiveOnly=\{filters\.active === "1"\}/);
 assert.match(manager,/!initialActiveOnly \|\| \(item\.currentQty \?\? 0\) > 0/);
 assert.doesNotMatch(page,/Confirm my collection/);
});
