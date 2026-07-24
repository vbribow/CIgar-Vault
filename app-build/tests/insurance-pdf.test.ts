import assert from "node:assert/strict";
import test from "node:test";
import { buildInsurancePdf } from "../lib/insurance-pdf";

const row=(index:number)=>({inventoryId:`INV-${index}`,cigar:`Arturo Fuente Rare Release ${index}`,vintage:"2026",packaging:"Box",quantity:10,unitReplacement:50,scheduledValue:500,storage:"Main humidor",photo:true,provenance:true,verification:"Documented"});

test("insurance export creates a valid downloadable PDF",()=>{
  const bytes=buildInsurancePdf([row(1)],"2026-07-23T12:00:00.000Z");
  const text=new TextDecoder().decode(bytes);
  assert.ok(bytes.length>500);
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.match(text,/CEDRIVA/);
  assert.match(text,/INV-1/);
  assert.match(text,/startxref/);
  assert.ok(text.endsWith("%%EOF"));
});

test("insurance PDF paginates a large collection",()=>{
  const text=new TextDecoder().decode(buildInsurancePdf(Array.from({length:70},(_,index)=>row(index+1)),"2026-07-23T12:00:00.000Z"));
  assert.match(text,/\/Count 3/);
  assert.match(text,/Page 3 of 3/);
});
