import assert from "node:assert/strict";
import test from "node:test";
import { collectionTemplates } from "../lib/collection-templates";
import { matchCollectionRequirements } from "../lib/collection-matching";

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

test("a partial OpusX name cannot be assigned to a different Dream to Dynasty component",()=>{
  const [match]=matchCollectionRequirements(["Fuente Fuente OpusX BBMF Natural"],[
    {inventoryId:"WRONG",brand:"Arturo Fuente",line:"OpusX",vitola:"Lost City Toro"},
  ],0.8);
  assert.equal(match.inventoryId,undefined);
});
