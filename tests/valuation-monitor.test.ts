import assert from "node:assert/strict";
import test from "node:test";
import { valuationMonitorPriority,valuationNeedsMonitoring } from "../lib/valuation-monitor";

const item={inventoryId:"I1",brand:"Cohiba",line:"Siglo IV",vitola:"Marevas",currentQty:20,retailValue:50,priority:"High"};
test("missing and stale valuations are scheduled",()=>{assert.equal(valuationNeedsMonitoring(item,[],new Date("2026-07-21")),true);assert.equal(valuationNeedsMonitoring(item,[{valuationId:"V1",inventoryId:"I1",valuationDate:"2025-01-01",marketValue:60}],new Date("2026-07-21")),true)});
test("recent valuations and empty lots are skipped",()=>{assert.equal(valuationNeedsMonitoring(item,[{valuationId:"V1",inventoryId:"I1",valuationDate:"2026-07-01",marketValue:60}],new Date("2026-07-21")),false);assert.equal(valuationNeedsMonitoring({...item,currentQty:0},[],new Date("2026-07-21")),false)});
test("high-value priority includes lot value and collector priority",()=>assert.equal(valuationMonitorPriority(item),11000));
