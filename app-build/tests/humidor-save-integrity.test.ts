import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("private humidor and changed storage assignments save atomically",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/humidors/route.ts"),"utf8");
  assert.match(source,/accountDataMode\(\) === "supabase"/);
  assert.match(source,/const changed=inventory\.flatMap/);
  assert.match(source,/kind:"humidors"/);
  assert.match(source,/kind:"inventory" as const/);
  assert.match(source,/saveOwnedRecordsAtomically\(\[/);
  assert.doesNotMatch(source,/saveOwnedRecord\("humidors"/);
  assert.doesNotMatch(source,/Promise\.all\(inventory\.map/);
});

test("a new humidor never preselects every unassigned inventory lot",()=>{
  const manager=fs.readFileSync(path.join(process.cwd(),"components/humidor-manager.tsx"),"utf8");
  assert.match(manager,/defaultChecked=\{current\?i\.storageLocationId===current\.humidorId:false\}/);
  assert.doesNotMatch(manager,/defaultChecked=\{i\.storageLocationId===current\?\.humidorId\}/);
});
