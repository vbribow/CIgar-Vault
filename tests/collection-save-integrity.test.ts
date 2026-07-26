import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("private collection and changed memberships save atomically",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/collections/route.ts"),"utf8");
  assert.match(source,/accountDataMode\(\) === "supabase"/);
  assert.match(source,/const changed=inventory\.flatMap/);
  assert.match(source,/kind:"collections"/);
  assert.match(source,/kind:"inventory" as const/);
  assert.match(source,/saveOwnedRecordsAtomically\(\[/);
  assert.doesNotMatch(source,/saveOwnedRecord\("collections"/);
  assert.doesNotMatch(source,/Promise\.all\(inventory\.map/);
});
