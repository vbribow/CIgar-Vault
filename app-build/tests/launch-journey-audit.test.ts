import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("the reusable launch audit covers every collector-critical journey",()=>{
  const output=execFileSync(process.execPath,[new URL("../scripts/audit-launch-journeys.mjs",import.meta.url).pathname],{encoding:"utf8"});
  assert.match(output,/7 critical journeys/);
});
