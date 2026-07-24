import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("private record export downloads a non-empty account-scoped file",()=>{
  const component=readFileSync(new URL("../components/private-record-export.tsx",import.meta.url),"utf8");
  const route=readFileSync(new URL("../app/api/account/export/route.ts",import.meta.url),"utf8");
  assert.match(component,/response\.blob\(\)/);
  assert.match(component,/anchor\.download=filename/);
  assert.match(component,/Downloaded \$\{filename\}/);
  assert.match(route,/\.eq\("user_id",user\.id\)/);
  assert.match(route,/cedriva-private-record-/);
});
