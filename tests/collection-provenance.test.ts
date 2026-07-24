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
  assert.equal(collectionComponentIdentity("3 Don Carlos The Man",father).vitola,"Robusto (5.25 × 50)");
});

test("source-backed collection identities preserve construction and exact dimensions",()=>{
  const legends=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-PADRON-LEGENDS")!;
  assert.equal(collectionComponentIdentity(legends.requirements[0],legends).vitola,"Box-pressed Churchill (7 × 50)");
  assert.equal(collectionComponentIdentity(legends.requirements[1],legends).vitola,"Round Churchill (7 × 50)");

  const purple=collectionTemplates.find(item=>item.templateId==="TPL-FUENTE-PURPLE-DREAM")!;
  assert.equal(collectionComponentIdentity("10 OpusX Purple Rain",purple).vitola,"Lonsdale figurado (6.875 × 44)");
  assert.equal(collectionComponentIdentity("10 OpusX BBMF Natural",purple).vitola,"Figurado (6.5 × 64)");

  const habanos=[
    ["TPL-HABANOS-HOYO-2003","Lusitanias (180 mm × 50)"],
    ["TPL-HABANOS-ROMEO-2004","Cañonazo No. 1 (180 mm × 52)"],
    ["TPL-HABANOS-TRINIDAD-2006","Torre Iznaga (152 mm × 52)"],
  ] as const;
  for(const [templateId,vitola] of habanos){
    const template=collectionTemplates.find(item=>item.templateId===templateId)!;
    assert.equal(collectionComponentIdentity(template.requirements[0],template).vitola,vitola);
    assert.equal(template.researchStatus,"Verified");
  }
});
