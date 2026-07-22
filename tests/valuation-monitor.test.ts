import assert from "node:assert/strict";
import test from "node:test";
import { inValuationBatches,valuationBatchSize,valuationMonitorPriority,valuationNeedsMonitoring } from "../lib/valuation-monitor";

const item={inventoryId:"I1",brand:"Cohiba",line:"Siglo IV",vitola:"Marevas",currentQty:20,retailValue:50,priority:"High"};
test("missing and stale valuations are scheduled",()=>{assert.equal(valuationNeedsMonitoring(item,[],new Date("2026-07-21")),true);assert.equal(valuationNeedsMonitoring(item,[{valuationId:"V1",inventoryId:"I1",valuationDate:"2025-01-01",marketValue:60}],new Date("2026-07-21")),true)});
test("recent valuations and empty lots are skipped",()=>{assert.equal(valuationNeedsMonitoring(item,[{valuationId:"V1",inventoryId:"I1",valuationDate:"2026-07-01",marketValue:60}],new Date("2026-07-21")),false);assert.equal(valuationNeedsMonitoring({...item,currentQty:0},[],new Date("2026-07-21")),false)});
test("high-value priority includes lot value and collector priority",()=>assert.equal(valuationMonitorPriority(item),11000));
test("valuation batches default to twelve and stay within safe limits",()=>{assert.equal(valuationBatchSize(),12);assert.equal(valuationBatchSize("50"),12);assert.equal(valuationBatchSize("0"),1);assert.equal(valuationBatchSize("invalid"),12)});
test("valuation work runs in bounded batches without losing order",async()=>{let active=0,peak=0;const results=await inValuationBatches([1,2,3,4,5],async value=>{active++;peak=Math.max(peak,active);await Promise.resolve();active--;return value*2},2);assert.deepEqual(results,[2,4,6,8,10]);assert.equal(peak,2)});
