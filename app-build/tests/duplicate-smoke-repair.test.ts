import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("duplicate repair is narrow, transactional, backed up, and restores one unit",()=>{
  const sql=readFileSync(new URL("../supabase/migrations/202607270001_repair_duplicate_smoke.sql",import.meta.url),"utf8");
  assert.match(sql,/array_length\(smoke_rows, 1\), 0\) <> 2/);
  assert.match(sql,/\(older\.payload - 'smokeId'\) <> \(newer\.payload - 'smokeId'\)/);
  assert.match(sql,/interval '10 minutes'/);
  assert.match(sql,/for update/);
  assert.match(sql,/'smokeSnapshots'/);
  assert.match(sql,/current_qty \+ 1/);
  assert.match(sql,/smoked_qty - 1/);
  assert.match(sql,/delete from public\.vault_records[\s\S]*record_id = newer\.record_id/);
});

test("repair endpoint cannot target another inventory lot or run without exact confirmation",()=>{
  const route=readFileSync(new URL("../app/api/smoking-log/repair-duplicate/route.ts",import.meta.url),"utf8");
  assert.match(route,/z\.literal\("INV-0053"\)/);
  assert.match(route,/z\.literal\("REMOVE_NEWER_EXACT_DUPLICATE"\)/);
  assert.match(route,/auth\.getUser\(\)/);
  assert.match(route,/repair_adjacent_duplicate_smoke/);
});
