import assert from "node:assert/strict";
import test from "node:test";
import { buildAcquisitionPlan } from "../lib/acquisition-planner";

test("builds acquisition targets from missing researched components", () => {
  const targets = buildAcquisitionPlan(
    [{ collectionId: "COL-FUENTE-PADRON-LEGENDS", name: "Fuente & Padrón Legends", releaseYear:2022, wholeMarketValue: 1000 }],
    [{ inventoryId: "A", brand: "Padrón", line: "Legends Carlos A. Fuente, Sr.", vitola: "Box-pressed Churchill (7 × 50)", originalQty:20, currentQty: 20, retailValue: 25, collectionId: "COL-FUENTE-PADRON-LEGENDS" }],
    [],
  );
  assert.equal(targets.length, 1);
  assert.equal(targets[0].requirement, "20 Fuente-made cigars honoring José O. Padrón");
  assert.equal(targets[0].estimatedValueImpact, 500);
  assert.equal(targets[0].priority, "High");
});

test("complete collections produce no acquisition targets", () => {
  const collectionId="COL-FUENTE-PADRON-LEGENDS";
  const inventory = [
    {inventoryId:"A",brand:"Padrón",line:"Legends Carlos A. Fuente, Sr.",vitola:"Box-pressed Churchill (7 × 50)",originalQty:20,currentQty:20,collectionId},
    {inventoryId:"B",brand:"Arturo Fuente",line:"Legends José O. Padrón",vitola:"Round Churchill (7 × 50)",originalQty:20,currentQty:20,collectionId},
  ];
  assert.equal(buildAcquisitionPlan([{ collectionId, name: "Fuente & Padrón Legends", releaseYear:2022 }], inventory, []).length, 0);
});
