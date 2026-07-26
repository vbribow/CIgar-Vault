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
