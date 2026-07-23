import assert from "node:assert/strict";
import test from "node:test";
import { buildAcquisitionPlan } from "../lib/acquisition-planner";

test("builds acquisition targets from missing researched components", () => {
  const targets = buildAcquisitionPlan(
    [{ collectionId: "COL-PADRON-COLLECTION", name: "Padrón Collection", wholeMarketValue: 1000 }],
    [{ inventoryId: "A", brand: "Padrón", line: "1964 Anniversary Series", vitola: "Toro", currentQty: 1, retailValue: 50, collectionId: "COL-PADRON-COLLECTION" }],
    [],
  );
  assert.equal(targets.length, 4);
  assert.ok(targets.some((target) => target.requirement === "Family Reserve"));
  assert.equal(targets[0].estimatedValueImpact, 237.5);
  assert.equal(targets[0].priority, "Medium");
});

test("complete collections produce no acquisition targets", () => {
  const inventory = ["Family Reserve", "1926 Serie", "1964 Anniversary Series", "Dámaso", "Padrón Series"].map((line, index) => ({ inventoryId: String(index), brand: "Padrón", line, vitola: "Toro", currentQty: 1, collectionId: "COL-PADRON-COLLECTION" }));
  assert.equal(buildAcquisitionPlan([{ collectionId: "COL-PADRON-COLLECTION", name: "Padrón Collection" }], inventory, []).length, 0);
});
