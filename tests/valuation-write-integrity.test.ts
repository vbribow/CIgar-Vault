import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("private retail valuation and inventory price save atomically",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/valuations/route.ts"),"utf8");
  assert.match(source,/accountDataMode\(\) === "supabase"/);
  assert.match(source,/saveOwnedRecordsAtomically\(records\)/);
  assert.doesNotMatch(source,/saveOwnedRecord\("valuations"/);
  assert.match(source,/records\.push\(\{kind:"inventory"/);
});

test("scheduled retail research saves valuation and inventory in one statement",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/valuation-monitor/route.ts"),"utf8");
  assert.match(source,/const records=\[/);
  assert.match(source,/kind:"valuations"/);
  assert.match(source,/kind:"inventory"/);
  assert.match(source,/upsert\(records,\{onConflict:"user_id,kind,record_id"\}\)/);
  assert.doesNotMatch(source,/from\("vault_records"\)\.update\(\{payload:updated/);
});

test("retail autofill saves the full private batch atomically",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/retail-prices/autofill/route.ts"),"utf8");
  assert.match(source,/suggestions\.flatMap/);
  assert.match(source,/saveOwnedRecordsAtomically\(records\)/);
  assert.match(source,/kind:"inventory" as const/);
  assert.match(source,/kind:"valuations" as const/);
});
