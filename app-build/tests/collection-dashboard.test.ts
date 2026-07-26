import assert from "node:assert/strict";
import test from "node:test";
import { collectionEditionIssue, summarizeCollection } from "../lib/collection-dashboard";
import { collectionTrustAudit } from "../lib/collection-trust";

test("summarizes whole value, premium, completeness, and history", () => {
  const collection = {
    collectionId: "COL-FUENTE-PADRON-LEGENDS",
    name: "Fuente & Padrón Legends",
    expectedComponents: 2,
    wholeMarketValue: 1500,
  };
  const inventory = [
    { inventoryId: "A", brand: "Padrón", line: "Legends Carlos A. Fuente, Sr.", vitola: "Box-pressed Churchill (7 × 50)", currentQty: 20, collectionId: collection.collectionId },
    { inventoryId: "B", brand: "Arturo Fuente", line: "Legends José O. Padrón", vitola: "Round Churchill (7 × 50)", currentQty: 20, collectionId: collection.collectionId },
  ];
  const valuations = [
    { valuationId: "V1", inventoryId: "A", valuationDate: "2026-01-01", marketValue: 20 },
    { valuationId: "V2", inventoryId: "B", valuationDate: "2026-01-01", marketValue: 25 },
  ];
  const result = summarizeCollection(collection, inventory, valuations);
  assert.equal(result.componentValue, 900);
  assert.equal(result.wholeValue, 1500);
  assert.equal(result.premium, 600);
  assert.equal(result.completionPercent, 100);
  assert.equal(result.missingComponents.length, 0);
  assert.equal(result.expectedCigars,40);
  assert.equal(result.valueEvidence,"Collection record");
  assert.equal(result.marketCoverage,2);
  assert.equal(result.completedSaleCoverage,0);
  assert.deepEqual(result.expectedContents,["20 Padrón-made cigars honoring Carlos A. Fuente, Sr.","20 Fuente-made cigars honoring José O. Padrón"]);
  assert.deepEqual(result.valueHistory, [{ date: "2026-01-01", value: 900 }]);
});

test("uses researched template value while keeping unsupported values visibly pending", () => {
  const researched = summarizeCollection({ collectionId: "COL-FUENTE-DREAM-DYNASTY", name: "From Dream to Dynasty Collection" }, [], []);
  assert.equal(researched.wholeValue, 2200);
  assert.equal(researched.valueEvidence, "Researched template");
  const unsupported = summarizeCollection({ collectionId: "COL-CUSTOM", name: "Custom Set" }, [], []);
  assert.equal(unsupported.wholeValue, 0);
  assert.equal(unsupported.valueEvidence, "Pending");
});

test("researched edition counts override stale provisional collection counts", () => {
  const result = summarizeCollection(
    { collectionId:"COL-FUENTE-PURPLE-DREAM", name:"Big Purple Dream Humidor", expectedComponents:2, expectedCigars:2 },
    [],
    [],
  );
  assert.equal(result.expectedComponents,10);
  assert.equal(result.expectedCigars,106);
});

test("lists missing template components", () => {
  const result = summarizeCollection(
    { collectionId: "COL-PADRON-COLLECTION", name: "Padrón Collection" },
    [{ inventoryId: "A", brand: "Padrón", line: "1964 Anniversary Series", vitola: "Toro", currentQty: 1, collectionId: "COL-PADRON-COLLECTION" }],
    [],
  );
  assert.equal(result.completionPercent, 20);
  assert.equal(result.missingComponents.length, 4);
  assert.ok(result.missingComponents.includes("Family Reserve"));
});

test("zero-quantity links remain historical evidence but do not make a collection complete", () => {
  const collection = { collectionId:"COL-PADRON-COLLECTION", name:"Padrón Collection" };
  const result=summarizeCollection(collection,[{
    inventoryId:"EMPTY",brand:"Padrón",line:"1964 Anniversary Series",vitola:"Exclusivo",
    currentQty:0,collectionId:collection.collectionId,
  }],[]);
  assert.equal(result.completionPercent,0);
  assert.equal(result.ownedComponents,0);
  assert.equal(result.missingComponents.length,5);
  assert.deepEqual(result.excludedAssignedLots,["EMPTY"]);
});

test("researched collections exclude incorrectly assigned cigars from completion and value", () => {
  const collection = { collectionId:"COL-PADRON-COLLECTION", name:"Padrón Collection" };
  const inventory = [
    { inventoryId:"RIGHT",brand:"Padrón",line:"1964 Anniversary Series",vitola:"Exclusivo",currentQty:1,retailValue:30,collectionId:collection.collectionId },
    { inventoryId:"WRONG",brand:"Arturo Fuente",line:"OpusX",vitola:"Double Corona",currentQty:20,retailValue:100,collectionId:collection.collectionId },
  ];
  const result=summarizeCollection(collection,inventory,[]);
  assert.equal(result.componentValue,30);
  assert.equal(result.completionPercent,20);
  assert.deepEqual(result.excludedAssignedLots,["WRONG"]);
});

test("a later standalone release cannot satisfy an earlier collection component", () => {
  const collection = { collectionId:"COL-FUENTE-DREAM-DYNASTY", name:"From Dream to Dynasty Collection", releaseYear:2024 };
  const inventory = [
    { inventoryId:"LATER",brand:"Arturo Fuente",line:"OpusX / Forbidden X",vitola:"Pasión de Amor",vintage:2026,currentQty:6,retailValue:60,collectionId:collection.collectionId },
    { inventoryId:"COLLECTION",brand:"Arturo Fuente",line:"OpusX Forbidden X Pasión d’Amor",vitola:"6.125 × 48",currentQty:1,retailValue:100,collectionId:collection.collectionId },
  ];
  const result=summarizeCollection(collection,inventory,[]);
  assert.ok(result.excludedAssignedLots.includes("LATER"));
  assert.equal(result.excludedAssignedLots.includes("COLLECTION"),false);
  assert.equal(result.componentValue,100);
});

test("a lower historical whole-set reference cannot create a negative premium", () => {
  const collection = { collectionId:"COL-FUENTE-PADRON-LEGENDS", name:"Fuente & Padrón Legends", releaseYear:2022, wholeMarketValue:100 };
  const inventory = [
    { inventoryId:"C1",collectionId:collection.collectionId,brand:"Padrón",line:"Legends Carlos A. Fuente, Sr.",vitola:"Box-pressed Churchill (7 × 50)",currentQty:20,retailValue:20 },
    { inventoryId:"C2",collectionId:collection.collectionId,brand:"Arturo Fuente",line:"Legends José O. Padrón",vitola:"Round Churchill (7 × 50)",currentQty:20,retailValue:20 },
  ];
  const result=summarizeCollection(collection,inventory,[]);
  assert.equal(result.componentValue,800);
  assert.equal(result.wholeValue,800);
  assert.equal(result.premium,0);
  assert.equal(result.valueEvidence,"Component inventory");
});

test("subtracts fully priced original cigars from a humidor collection retail price", () => {
  const collection = { collectionId:"COL-FUENTE-PURPLE-DREAM", name:"Big Purple Dream Humidor" };
  const quantities=[10,6,10,10,10,10,10,10,20,10];
  const lines=["OpusX Purple Rain","OpusX Big B","OpusX BBMF Natural","OpusX BBMF Maduro","OpusX El Escorpion Natural","OpusX El Escorpion Maduro","OpusX Rare Black Torpedo","OpusX Rare Black Double Corona","OpusX Scorpio Maduro","OpusX Tauros the Bull Maduro"];
  const inventory=quantities.map((originalQty,index)=>({
    inventoryId:`P${index}`,brand:"Arturo Fuente",line:lines[index],vitola:"Size to verify",
    originalQty,currentQty:Math.max(0,originalQty-1),retailValue:50,collectionId:collection.collectionId,
  }));
  inventory[0].line="OpusX Heaven and Earth Purple Rain";
  inventory[0].vitola="Lonsdale figurado (6.875 × 44)";
  inventory[2].vitola="Figurado (6.5 × 64)";
  inventory[3].vitola="Figurado (6.5 × 64)";
  const result=summarizeCollection(collection,inventory,[]);
  assert.equal(result.wholeValue,12975);
  assert.equal(result.cigarRetailValue,5300);
  assert.equal(result.humidorValue,7675);
  assert.equal(result.humidorValueStatus,"Calculated");
});

test("does not estimate a humidor residual until every included cigar has retail evidence", () => {
  const collection = { collectionId:"COL-FUENTE-PURPLE-DREAM", name:"Big Purple Dream Humidor" };
  const result=summarizeCollection(collection,[{inventoryId:"P1",brand:"Arturo Fuente",line:"Purple Rain",vitola:"Diadema",originalQty:10,currentQty:10,collectionId:collection.collectionId}],[]);
  assert.equal(result.humidorValue,undefined);
  assert.equal(result.humidorValueStatus,"Awaiting complete cigar retail values");
});

test("blocks a researched collection when its saved release year identifies another edition",()=>{
 assert.equal(collectionEditionIssue({collectionId:"COL-FUENTE-GRAN-FUMADA-2022",name:"La Gran Fumada",releaseYear:2023}),"Saved release year 2023 does not match the researched 2022 edition.");
 assert.equal(collectionEditionIssue({collectionId:"COL-FUENTE-GRAN-FUMADA-2022",name:"La Gran Fumada",releaseYear:2022}),undefined);
 assert.equal(collectionEditionIssue({collectionId:"COL-FUENTE-GRAN-FUMADA-2023",name:"La Gran Fumada Vol. II",releaseYear:"2023" as unknown as number}),undefined);
});

test("collection trust keeps aftermarket sales optional while exposing every evidence gap",()=>{
 const collection={collectionId:"COL-FUENTE-PADRON-LEGENDS",name:"Fuente & Padrón Legends",releaseYear:2022};
 const inventory=[
  {inventoryId:"A",collectionId:collection.collectionId,brand:"Padrón",line:"Legends Carlos A. Fuente, Sr.",vitola:"Box-pressed Churchill (7 × 50)",currentQty:20,retailValue:40},
  {inventoryId:"B",collectionId:collection.collectionId,brand:"Arturo Fuente",line:"Legends José O. Padrón",vitola:"Round Churchill (7 × 50)",currentQty:20,retailValue:40},
 ];
 const audit=collectionTrustAudit(collection,inventory,[]);
 assert.equal(audit.checks.find(check=>check.id==="edition")?.status,"Verified");
 assert.equal(audit.checks.find(check=>check.id==="inventory")?.status,"Verified");
 assert.equal(audit.checks.find(check=>check.id==="retail")?.status,"Verified");
 assert.equal(audit.checks.find(check=>check.id==="aftermarket")?.status,"Researching");
 assert.equal(audit.ready,true);
});

test("collection trust rejects a collection year copied from the wrong edition",()=>{
 const audit=collectionTrustAudit(
  {collectionId:"COL-FUENTE-GRAN-FUMADA-2022",name:"La Gran Fumada",releaseYear:2023},
  [],
  [],
 );
 assert.equal(audit.checks.find(check=>check.id==="edition")?.status,"Attention");
 assert.equal(audit.ready,false);
});
