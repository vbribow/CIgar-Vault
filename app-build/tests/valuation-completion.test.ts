import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const panel=readFileSync(new URL("../components/valuation-completion-panel.tsx",import.meta.url),"utf8");
const monitor=readFileSync(new URL("../app/api/valuation-monitor/route.ts",import.meta.url),"utf8");

test("completion batches six records with bounded two-record concurrency",()=>{
  assert.match(panel,/BATCH_SIZE=6/);
  assert.match(panel,/index\+=2/);
  assert.match(panel,/Promise\.all/);
});

test("completion only saves source-backed medium or high confidence evidence",()=>{
  assert.match(panel,/!draft\.sourceUrl/);
  assert.match(panel,/draft\.confidence==="Low"/);
  assert.match(panel,/\/api\/valuations/);
});

test("scheduled completion supports the live Smartsheet master inventory",()=>{
  assert.match(monitor,/dataMode\(\)==="smartsheet"/);
  assert.match(monitor,/getInventory\(\),getValuations\(\)/);
  assert.match(monitor,/recordValuation\(valuation\)/);
});
