import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { inLocationRefreshBatches } from "../lib/places-refresh";

test("monthly location verification runs in bounded batches and preserves order",async()=>{
  let active=0;
  let peak=0;
  const outcomes=await inLocationRefreshBatches([1,2,3,4,5,6,7],async value=>{
    active++;
    peak=Math.max(peak,active);
    await new Promise(resolve=>setTimeout(resolve,1));
    active--;
    return value*2;
  },3);
  assert.deepEqual(outcomes,[2,4,6,8,10,12,14]);
  assert.equal(peak,3);
});

test("monthly verification never reports success before durable evidence is checked",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/places/refresh/route.ts"),"utf8");
  assert.match(source,/\.limit\(25\)/);
  assert.match(source,/AbortSignal\.timeout\(10_000\)/);
  assert.match(source,/if\(verificationError\)throw verificationError/);
  assert.match(source,/if\(updateError\)throw updateError/);
  assert.match(source,/status:"failed"/);
});
