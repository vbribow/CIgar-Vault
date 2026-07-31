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
  assert.match(panel,/draft\.automaticSaveEligible/);
  assert.match(panel,/\/api\/valuations/);
});

test("signed-in valuation work starts automatically when research is enabled",()=>{
  assert.match(panel,/useEffect/);
  assert.match(panel,/\/api\/account\/preferences/);
  assert.match(panel,/fetch\("\/api\/valuation-research"/);
  assert.match(panel,/valuationResearch!==false/);
  assert.match(panel,/readiness\.data\?\.configured/);
  assert.match(panel,/await run\(\)/);
  assert.match(panel,/production monitor checks the queue hourly/);
  assert.match(panel,/waiting for its secure research connection/);
});

test("completion records uncertain research once and defers duplicate paid searches",()=>{
  assert.match(panel,/marketEvidenceType:"Insufficient evidence"/);
  assert.match(panel,/held for human review and deferred from repeated automated research/);
  assert.match(panel,/Current queue is clear/);
  assert.match(panel,/no price has been invented/);
  const page=readFileSync(new URL("../app/valuations/page.tsx",import.meta.url),"utf8");
  assert.match(page,/valuationNeedsMonitoring\(row\.item,valuations\)/);
  assert.match(page,/need active value work/);
  assert.match(page,/completionQueue\.slice/);
});

test("completion refuses paid valuation research before exact cigar identity is resolved",()=>{
  const page=readFileSync(new URL("../app/valuations/page.tsx",import.meta.url),"utf8");
  assert.match(page,/row\.item\.status!==\"Review\"/);
  assert.ok(page.includes("&&!/verify|unknown/i.test(row.item.vitola)"));
});

test("scheduled completion supports the live Smartsheet master inventory",()=>{
  assert.match(monitor,/dataMode\(\)==="smartsheet"/);
  assert.match(monitor,/getInventory\(\),getValuations\(\)/);
  assert.match(monitor,/recordValuation\(valuation\)/);
});

test("scheduled completion preserves asking, range, sale, and insufficient-evidence distinctions",()=>{
  assert.match(monitor,/marketEvidenceType:research\.marketEvidenceType/);
  assert.match(monitor,/askingPrice:research\.askingPriceSourceUrl/);
  assert.match(monitor,/marketRangeLow:supported/);
  assert.match(monitor,/lastSaleValue:research\.lastSaleSourceUrl/);
  assert.match(monitor,/Insufficient aftermarket evidence/);
});
