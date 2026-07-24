import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCollectionProvenance } from "../lib/collection-provenance";
import { collectionTemplates } from "../lib/collection-templates";
import { collectionComponentIdentity } from "../lib/collection-components";

test("collection chronology never treats the set year as every cigar's year",()=>{
  const template=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-DREAM-DYNASTY")!;
  const summary=summarizeCollectionProvenance(
    {collectionId:"COL-FUENTE-DREAM-DYNASTY",name:template.name,releaseYear:2024},
    template,
    [
      {inventoryId:"KNOWN",brand:"Arturo Fuente",line:"OpusX",vitola:"Robusto",vintage:2019},
      {inventoryId:"UNKNOWN",brand:"Arturo Fuente",line:"OpusX",vitola:"Toro"},
    ],
  );
  assert.equal(summary.collectionYear,2024);
  assert.equal(summary.recordedComponentYears,1);
  assert.equal(summary.unknownComponentYears,1);
  assert.match(summary.yearPolicy,/never inherited/i);
});

test("audited collection evidence corrects Gran Fumada and preserves known Father and Son sizes",()=>{
  const gran=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-GRAN-FUMADA-2023")!;
  assert.ok(gran.requirements.includes("OpusX Oro Oscuro OxO Lancero 2004 Aged Selection"));
  assert.ok(!gran.requirements.some(requirement=>/OxO Phantom/i.test(requirement)));
  const father=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-FATHER-SON-2026")!;
  assert.equal(collectionComponentIdentity("OpusX 25",father).vitola,"Robusto");
  assert.equal(collectionComponentIdentity("Don Carlos 90 Años",father).vitola,"Corona");
});
