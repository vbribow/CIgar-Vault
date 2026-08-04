import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("every literal internal page, download, and router destination resolves",()=>{
  const result=execFileSync(process.execPath,["scripts/audit-internal-links.mjs"],{encoding:"utf8"});
  assert.match(result,/Internal navigation audit passed/);
  const routeCount=Number(result.match(/(\d+) routes/)?.[1]);
  assert.ok(routeCount>=165,`expected at least 165 protected routes, received ${routeCount}`);
});
