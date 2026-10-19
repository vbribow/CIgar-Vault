import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const route=readFileSync(new URL("../app/api/account/export/route.ts",import.meta.url),"utf8");

test("private record export downloads a non-empty account-scoped file",()=>{
  const component=readFileSync(new URL("../components/private-record-export.tsx",import.meta.url),"utf8");
  assert.match(component,/response\.blob\(\)/);
  assert.match(component,/anchor\.download=filename/);
  assert.match(component,/Downloaded \$\{filename\}/);
  assert.match(route,/loadAllAccountVaultRecords\(supabase,user\.id,portableAccountRecordKinds\)/);
  assert.match(route,/private-collector-record-/);
});

test("complete account export paginates beyond the provider's one-thousand-row response cap",()=>{
  const store=readFileSync(new URL("../lib/account-record-store.ts",import.meta.url),"utf8");
  assert.match(store,/\.eq\("user_id",userId\)/);
  assert.match(store,/accountRecordPageSize=1000/);
  assert.match(store,/\.range\(from,from\+accountRecordPageSize-1\)/);
  assert.match(store,/if\(page\.length<accountRecordPageSize\)return records/);
});

test("portable recovery excludes high-volume and regenerated operational records transparently",()=>{
  const store=readFileSync(new URL("../lib/account-record-store.ts",import.meta.url),"utf8");
  const component=readFileSync(new URL("../components/create-recovery-point.tsx",import.meta.url),"utf8");
  assert.match(store,/portableAccountRecordKinds/);
  assert.doesNotMatch(store,/portableAccountRecordKinds=\[[\s\S]*"readings"/);
  assert.match(route,/kind:"readings"/);
  assert.match(route,/kind:"integrity"/);
  assert.match(route,/kind:"system-runs"/);
  assert.match(component,/High-volume sensor readings remain protected/);
});

test("complete vault export records an auditable recovery point",()=>{
  assert.match(route,/saveOwnedRecord\("integrity"/);
  assert.match(route,/action:\s*"inventory-backup"/);
  assert.match(route,/scope:\s*"portable-account-recovery"/);
  assert.match(route,/record\.kind === "inventory"/);
  assert.match(route,/totalRecordCount:\s*payload\.recordCount/);
});

test("smoking performance fields remain inside the complete opaque vault payload",()=>{
  const security=readFileSync(new URL("../lib/account-security.ts",import.meta.url),"utf8");
  const recovery=readFileSync(new URL("../lib/account-recovery.ts",import.meta.url),"utf8");
  assert.match(security,/records:\s*input\.records/);
  assert.match(security,/payload:\s*unknown/);
  assert.match(recovery,/payload:\s*z\.record\(z\.string\(\),z\.unknown\(\)\)/);
});
