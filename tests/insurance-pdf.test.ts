import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildInsurancePdf } from "../lib/insurance-pdf";
import type { Valuation } from "../lib/types";

const row=(index:number)=>({inventoryId:`INV-${index}`,cigar:`Arturo Fuente Rare Release ${index}`,vintage:"2026",packaging:"Box",quantity:10,unitReplacement:50,scheduledValue:500,storage:"Main humidor",photo:true,provenance:true,verification:"Documented"});

test("insurance export creates a valid downloadable PDF",()=>{
  const bytes=buildInsurancePdf([row(1)],"2026-07-23T12:00:00.000Z");
  const text=new TextDecoder().decode(bytes);
  assert.ok(bytes.length>500);
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.match(text,/HOJAVIA/);
  assert.doesNotMatch(text,/CEDRIVA/);
  assert.match(text,/INV-1/);
  assert.match(text,/startxref/);
  assert.ok(text.endsWith("%%EOF"));
});

test("insurance PDF paginates a large collection",()=>{
  const text=new TextDecoder().decode(buildInsurancePdf(Array.from({length:70},(_,index)=>row(index+1)),"2026-07-23T12:00:00.000Z"));
  assert.match(text,/\/Count 12/);
  assert.match(text,/Page 12 of 12/);
});

test("full-sized insurance PDF is bounded and preserves every valuation evidence distinction",()=>{
  const rows=Array.from({length:750},(_,index)=>row(index+1));
  const valuations:Valuation[]=[
    {valuationId:"retail",inventoryId:"INV-1",valuationDate:"2026-07-01",replacementValue:50},
    {valuationId:"asking",inventoryId:"INV-1",valuationDate:"2026-07-02",askingPrice:65,askingPriceSourceUrl:"https://example.com/asking",marketEvidenceType:"Observed asking price"},
    {valuationId:"range",inventoryId:"INV-1",valuationDate:"2026-07-03",marketValue:70,marketRangeLow:60,marketRangeHigh:80,marketEvidenceType:"Estimated market range",comparableCount:2},
    {valuationId:"sale",inventoryId:"INV-1",valuationDate:"2026-07-04",lastSaleValue:72,lastSaleDate:"2026-06-30",lastSaleSourceUrl:"https://example.com/sold"},
    {valuationId:"legacy",inventoryId:"INV-2",valuationDate:"2026-07-04",marketValue:90,source:"Historical completed sale claim"},
  ];
  const started=performance.now();
  const bytes=buildInsurancePdf(rows,"2026-07-23T12:00:00.000Z",valuations);
  const elapsed=performance.now()-started;
  const text=new TextDecoder().decode(bytes);
  assert.ok(elapsed<1_000,`PDF generation took ${elapsed.toFixed(0)}ms`);
  assert.ok(bytes.length<5_000_000);
  assert.match(text,/Active lots: 750/);
  assert.match(text,/Known cigars: 7500/);
  assert.match(text,/Retail replacement/);
  assert.match(text,/Market asking price - no confirmed sale/);
  assert.match(text,/Estimated market range/);
  assert.match(text,/Verified completed sale/);
  assert.match(text,/Legacy market value - completed sale unverified/);
});

test("private insurance download uses bounded authenticated server generation and no-store headers",()=>{
  const route=readFileSync(new URL("../app/api/reports/insurance-pdf/route.ts",import.meta.url),"utf8");
  const actions=readFileSync(new URL("../components/report-actions.tsx",import.meta.url),"utf8");
  assert.match(route,/auth\.getUser\(\)/);
  assert.match(route,/MAX_PRIVATE_RECORDS \+ 1/);
  assert.ok(route.includes('"Content-Type":"application/pdf"'));
  assert.match(route,/"Cache-Control":"private, no-store, max-age=0"/);
  assert.match(route,/"Content-Disposition":`attachment;/);
  assert.match(actions,/Preparing secure PDF/);
  assert.match(actions,/aria-busy=\{downloading\}/);
  assert.match(actions,/if\(downloading\)return/);
});
