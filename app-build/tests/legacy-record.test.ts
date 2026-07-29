import assert from "node:assert/strict";
import test from "node:test";
import { buildLegacyRecord } from "../lib/legacy-record";

test("legacy record measures documented history without inventing it",()=>{
  const record=buildLegacyRecord([
    {inventoryId:"I-1",brand:"Arturo Fuente",line:"OpusX",vitola:"Double Corona",vintage:2005,currentQty:2,priority:"High",provenanceNotes:"Acquired at anniversary dinner",photoLink:"https://example.com/photo.jpg",retailValue:80},
    {inventoryId:"I-2",brand:"Cohiba",line:"Siglo IV",vitola:"Corona Gorda",currentQty:20},
  ],[],[],[]);
  assert.equal(record.earliestYear,2005);
  assert.equal(record.coverage.provenance,50);
  assert.equal(record.coverage.value,50);
  assert.equal(record.significant[0].inventoryId,"I-1");
  assert.equal(record.timeline.length,0);
});

test("legacy record orders the newest documented activity first",()=>{
  const inventory=[{inventoryId:"I-1",brand:"Padrón",line:"1964",vitola:"Exclusivo"}];
  const activities=[
    {activityId:"A-1",inventoryId:"I-1",eventDate:"2025-01-01",eventType:"Purchase" as const},
    {activityId:"A-2",inventoryId:"I-1",eventDate:"2026-01-01",eventType:"Gift" as const},
  ];
  const record=buildLegacyRecord(inventory,[],[],activities);
  assert.equal(record.timeline[0].activityId,"A-2");
});
