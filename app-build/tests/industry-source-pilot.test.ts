import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { opusXSingleSourcePilot, validateSingleSourceDossier } from "../lib/industry-source-pilot";

test("single-source pilot preserves exact official OpusX formats",()=>{
  const dossier=validateSingleSourceDossier(opusXSingleSourcePilot);
  assert.equal(dossier.vitolas.length,14);
  assert.deepEqual(dossier.vitolas.find(item=>item.name==="Fuente Fuente"),{name:"Fuente Fuente",lengthInches:5.625,lengthMm:143,ringGauge:46,ringGaugeMm:18,perBox:32});
  assert.deepEqual(dossier.vitolas.find(item=>item.name==="Double Corona"),{name:"Double Corona",lengthInches:7.625,lengthMm:194,ringGauge:49,ringGaugeMm:19,perBox:32});
  assert.equal(new Set(dossier.vitolas.map(item=>`${item.name}|${item.lengthInches}|${item.ringGauge}`)).size,14);
});

test("single-source pilot cannot masquerade as an authorized organization record",()=>{
  assert.equal(opusXSingleSourcePilot.status,"Draft — founder review required");
  assert.match(opusXSingleSourcePilot.source.sourceClass,/organization not yet verified/i);
  assert.ok(opusXSingleSourcePilot.unresolved.includes("Authorized Hojavía organization identity and contact"));
  assert.ok(opusXSingleSourcePilot.unresolved.includes("Exact rolling factory and production-period changes"));
  assert.ok(opusXSingleSourcePilot.unresolved.includes("Current MSRP and market-specific pricing"));
});

test("single-source dossier validation rejects absent uncertainty",()=>{
  assert.throws(()=>validateSingleSourceDossier({...opusXSingleSourcePilot,unresolved:[]}),/must disclose unresolved facts/i);
});

test("founder review surface labels the pilot private and non-publishable",async()=>{
  const component=await readFile(new URL("../components/industry-source-pilot.tsx",import.meta.url),"utf8");
  const platform=await readFile(new URL("../components/partner-platform.tsx",import.meta.url),"utf8");
  assert.match(component,/private research dossier/i);
  assert.match(component,/neither an authorized organization submission nor publishable content/i);
  assert.match(component,/has no approval or publication action/i);
  assert.match(platform,/<IndustrySourcePilot\/>/);
});
