import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();

test("daily briefing withholds rankings when any evidence source fails",()=>{
  const source=fs.readFileSync(path.join(root,"app/briefing/page.tsx"),"utf8");
  assert.match(source,/Promise\.allSettled/);
  assert.match(source,/every\(result=>result\.status==="fulfilled"\)/);
  assert.match(source,/No partial briefing has been presented as complete/);
});

test("decision center withholds recommendations when any private source fails",()=>{
  const source=fs.readFileSync(path.join(root,"app/decision-center/page.tsx"),"utf8");
  assert.match(source,/Promise\.allSettled/);
  assert.match(source,/every\(result=>result\.status==="fulfilled"\)/);
  assert.match(source,/No partial evidence has been turned into a recommendation/);
});
