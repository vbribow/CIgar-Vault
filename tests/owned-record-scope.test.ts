import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source=readFileSync("lib/user-data.ts","utf8");

test("every collector read, conditional update, and delete is explicitly owner scoped",()=>{
  const ownerFilters=source.match(/\.eq\("user_id", context\.user\.id\)/g)??[];
  assert.equal(ownerFilters.length,7);
  assert.match(source,/select\("payload"\)\.eq\("user_id", context\.user\.id\)\.eq\("kind", kind\)/);
  assert.match(source,/select\("payload,updated_at"\)\s*\.eq\("user_id", context\.user\.id\)/);
  assert.match(source,/update\(\{ payload, updated_at: new Date\(\)\.toISOString\(\) \}\)\s*\.eq\("user_id", context\.user\.id\)/);
  assert.match(source,/delete\(\)\.eq\("user_id", context\.user\.id\)\.eq\("kind", kind\)/);
});

test("collector writes continue stamping the authenticated owner",()=>{
  assert.match(source,/user_id: context\.user\.id/);
  assert.match(source,/onConflict: "user_id,kind,record_id"/);
});
