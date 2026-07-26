import assert from "node:assert/strict";
import test from "node:test";
import {
  collectionTemplates,
  completeCollectionComponentEvidence,
} from "../lib/collection-templates";
import { cigarIdentityKey } from "../lib/cigar-identity";

const template=(id:string)=>{
  const result=collectionTemplates.find(candidate=>candidate.templateId===id);
  assert.ok(result,`Missing fixture ${id}`);
  return result;
};
const readiness=(id:string)=>{
  const value=template(id);
  const sourced=(value.componentEvidence??[]).filter(completeCollectionComponentEvidence);
  return {
    physicalLots:value.expectedComponents,
    identities:new Set(sourced.map(cigarIdentityKey)).size,
    cigars:value.expectedCigars,
    sourced:sourced.length,
    requirements:value.requirements.length,
    autoReady:sourced.length===value.requirements.length,
  };
};

test("Purple Dream acceptance fixture preserves 106 cigars as 11 lots and 10 identities", () => {
  const purple=template("TPL-FUENTE-PURPLE-DREAM");
  assert.deepEqual(readiness(purple.templateId),{
    physicalLots:11,
    identities:10,
    cigars:106,
    sourced:11,
    requirements:11,
    autoReady:true,
  });
  assert.deepEqual(purple.presentationAliases,[
    "OpusX Purple Dream Humidor",
    "Big Purple Dream Humidor",
  ]);
});

test("the five collection acceptance fixtures freeze incomplete sourcing", () => {
  assert.equal(readiness("TPL-FUENTE-DREAM-DYNASTY").autoReady,false);
  assert.equal(readiness("TPL-FUENTE-GRAN-FUMADA-2023").autoReady,false);
  assert.equal(readiness("TPL-FUENTE-PADRON-LEGENDS").autoReady,true);
  assert.equal(readiness("TPL-FUENTE-FATHER-SON-2026").autoReady,false);
});
