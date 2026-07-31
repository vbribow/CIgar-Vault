import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const route=readFileSync(new URL("../app/api/account/export/route.ts",import.meta.url),"utf8");

test("private record export downloads a non-empty account-scoped file",()=>{
  const component=readFileSync(new URL("../components/private-record-export.tsx",import.meta.url),"utf8");
  assert.match(component,/response\.blob\(\)/);
  assert.match(component,/anchor\.download=filename/);
  assert.match(component,/Downloaded \$\{filename\}/);
  assert.match(route,/\.eq\("user_id",user\.id\)/);
  assert.match(route,/private-collector-record-/);
});

test("complete vault export records an auditable recovery point",()=>{
  assert.match(route,/saveOwnedRecord\("integrity"/);
  assert.match(route,/action:\s*"inventory-backup"/);
  assert.match(route,/scope:\s*"complete-account"/);
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
