import assert from "node:assert/strict";
import test from "node:test";
import {
  auditCollectionTemplateProtocol,
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
  const protocol=auditCollectionTemplateProtocol(purple);
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
  assert.equal(protocol.readyForInventoryAutomation,true);
  assert.equal(protocol.documentedPhysicalLots,11);
  assert.equal(protocol.documentedCigars,106);
});

test("every formerly frozen collection is reconciled through exact sourced physical lots", () => {
  assert.equal(readiness("TPL-MY-FATHER-BELICOSOS").autoReady,true);
  assert.equal(readiness("TPL-FUENTE-DREAM-DYNASTY").autoReady,true);
  assert.equal(readiness("TPL-FUENTE-GRAN-FUMADA-2022").autoReady,true);
  assert.equal(readiness("TPL-FUENTE-GRAN-FUMADA-2023").autoReady,true);
  assert.equal(readiness("TPL-FUENTE-PADRON-LEGENDS").autoReady,true);
  assert.equal(readiness("TPL-FUENTE-FATHER-SON-2026").autoReady,true);
  assert.equal(readiness("TPL-PADRON-COLLECTION").autoReady,true);
  for(const id of [
    "TPL-MY-FATHER-BELICOSOS",
    "TPL-FUENTE-GRAN-FUMADA-2022",
    "TPL-FUENTE-GRAN-FUMADA-2023",
    "TPL-FUENTE-FATHER-SON-2026",
    "TPL-PADRON-COLLECTION",
  ]){
    assert.equal(auditCollectionTemplateProtocol(template(id)).readyForInventoryAutomation,true,id);
  }
});

test("the universal protocol blocks incomplete present and future collections",()=>{
  const future={
    ...template("TPL-FUENTE-PADRON-LEGENDS"),
    templateId:"TPL-FUTURE",
    name:"Future collection",
    expectedComponents:1,
    expectedCigars:1,
    requirements:["Future cigar exact vitola"],
    componentEvidence:[{
      requirement:"Future cigar exact vitola",
      brand:"Future Brand",
      line:"Future Line",
      vitola:"Future Vitola",
    }],
  };
  const audit=auditCollectionTemplateProtocol(future);
  assert.equal(audit.readyForInventoryAutomation,false);
  assert.deepEqual(audit.unresolvedRequirements,["Future cigar exact vitola"]);
  assert.match(audit.issues.join(" "),/attributable exact-vitola evidence/);
});

test("numbered cigar series are never interpreted as collection quantities",()=>{
  const padron=auditCollectionTemplateProtocol(template("TPL-PADRON-COLLECTION"));
  assert.equal(padron.documentedCigars,5);
  assert.equal(padron.readyForInventoryAutomation,true);
});

test("every collection admitted for automation satisfies the same exact-lot and quantity protocol",()=>{
  for(const value of collectionTemplates){
    const audit=auditCollectionTemplateProtocol(value);
    if(!audit.readyForInventoryAutomation)continue;
    assert.equal(audit.unresolvedRequirements.length,0,value.name);
    assert.equal(audit.documentedPhysicalLots,audit.expectedPhysicalLots,value.name);
    if(audit.expectedCigars!==undefined)assert.equal(audit.documentedCigars,audit.expectedCigars,value.name);
  }
});
