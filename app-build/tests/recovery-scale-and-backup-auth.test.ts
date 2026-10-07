import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {AccountExportSchema,MAX_RECOVERY_RECORDS} from "../lib/account-recovery";

test("account recovery accepts a complete long-history export",()=>{
  assert.equal(MAX_RECOVERY_RECORDS,250000);
  const records=Array.from({length:10_001},(_,index)=>({kind:"readings" as const,record_id:`R-${index}`,payload:{index}}));
  const parsed=AccountExportSchema.safeParse({format:"hojavia-account-export",version:2,createdAt:"2026-10-07T12:00:00.000Z",owner:{userId:"U1"},recordCount:records.length,records});
  assert.equal(parsed.success,true);
});

test("private account backup is the default and shared master export requires founder authorization",()=>{
  const route=readFileSync(new URL("../app/api/inventory-integrity/backup/route.ts",import.meta.url),"utf8");
  assert.match(route,/requestedScope === "master" \? "master" : "account"/);
  assert.match(route,/scope==="master"&&!authorizeWrite\(request\)/);
});

test("rollback records its exact deletion plan before any destructive call",()=>{
  const route=readFileSync(new URL("../app/api/account/import-inventory/route.ts",import.meta.url),"utf8");
  const planned=route.indexOf('action:"inventory-spreadsheet-import-rollback-started"');
  const deletion=route.indexOf('deleteOwnedRecords("inventory"');
  assert.ok(planned>=0&&deletion>planned);
  assert.match(route,/plannedInventoryIds:inventoryRollback\.removable/);
  assert.match(route,/plannedValuationIds:valuationRollback\.removable/);
});
