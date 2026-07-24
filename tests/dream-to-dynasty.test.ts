import assert from "node:assert/strict";
import test from "node:test";
import { collectionTemplates } from "../lib/collection-templates";
import { collectionComponentIdentity } from "../lib/collection-components";
import { matchCollectionRequirements } from "../lib/collection-matching";
import { summarizeCollection } from "../lib/collection-dashboard";

const dream=collectionTemplates.find(template=>template.templateId==="TPL-FUENTE-DREAM-DYNASTY")!;

test("Dream to Dynasty uses the documented 2024 Collection XXII contents",()=>{
  assert.equal(dream.releaseYear,2024);
  assert.equal(dream.expectedComponents,22);
  assert.equal(dream.expectedCigars,22);
  assert.equal(new Set(dream.requirements).size,22);
  assert.deepEqual(dream.requirements.slice(0,3),[
    "Arturo Fuente Flor Fina 8-5-8 Natural",
    "Arturo Fuente Hemingway Classic",
    "Arturo Fuente Hemingway Between the Lines",
  ]);
  assert.ok(dream.requirements.includes("Casa Fuente Lancero"));
  assert.ok(dream.requirements.includes("Fuente Fuente OpusX Rising X"));
  assert.ok(dream.requirements.includes("J.C. Newman Diamond Crown Perfecto"));
});

test("Dream to Dynasty uses measured physical vitolas without confusing product names for sizes",()=>{
  const components=dream.requirements.map(requirement=>collectionComponentIdentity(requirement,dream));
  assert.equal(components.length,22);
  assert.ok(components.every(component=>component.needsIdentityReview===false));
  assert.ok(components.every(component=>component.vitola!=="Size to verify"));
  assert.deepEqual(components.find(component=>component.line==="Hemingway Classic"),{
    brand:"Arturo Fuente",line:"Hemingway Classic",vitola:"Perfecto (7 × 48)",quantity:1,needsIdentityReview:false,
  });
  assert.equal(components.find(component=>component.line==="ESG 20-Year Salute")?.vitola,"Churchill (6.75 × 49)");
  assert.equal(components.find(component=>component.line==="OpusX Angel’s Share Fuente Fuente")?.vitola,"5.625 × 46");
});

test("a partial OpusX name cannot be assigned to a different Dream to Dynasty component",()=>{
  const [match]=matchCollectionRequirements(["Fuente Fuente OpusX BBMF Natural"],[
    {inventoryId:"WRONG",brand:"Arturo Fuente",line:"OpusX",vitola:"Lost City Toro"},
  ],0.8);
  assert.equal(match.inventoryId,undefined);
});

test("an incorrectly attached cigar is excluded from Dream to Dynasty completion and value",()=>{
  const collection={collectionId:"COL-FUENTE-DREAM-DYNASTY",name:"From Dream to Dynasty Collection"};
  const inventory=[{inventoryId:"WRONG",collectionId:collection.collectionId,brand:"Arturo Fuente",line:"OpusX",vitola:"Petite Lancero",currentQty:1,retailValue:100}];
  const summary=summarizeCollection(collection,inventory,[]);
  assert.equal(summary.ownedComponents,0);
  assert.equal(summary.componentValue,0);
  assert.equal(summary.cigarRetailValue,0);
  assert.equal(summary.missingComponents.length,22);
});
