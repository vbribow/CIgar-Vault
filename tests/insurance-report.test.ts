import test from "node:test";
import assert from "node:assert/strict";
import { buildInsuranceReport } from "../lib/insurance-report";
import type { Humidor, InventoryItem } from "../lib/types";

const inventory: InventoryItem[] = [
  { inventoryId: "I1", brand: "Cohiba", line: "Siglo IV", vitola: "Corona Gorda", packaging: "Box of 25", currentQty: 25, retailValue: 60, storageLocationId: "H1", photoLink: "https://example.com/photo", provenanceNotes: "Purchased at retailer", boxCode: "ABC JUL 26", habanosSealPhotoLink: "https://example.com/seal", habanosVerified: true },
  { inventoryId: "I2", brand: "Arturo Fuente", line: "OpusX", vitola: "Robusto", currentQty: 2 },
];
const humidor: Humidor = { humidorId: "H1", name: "Main", targetTempF: 68, minTempF: 65, maxTempF: 72, targetHumidity: 67, minHumidity: 62, maxHumidity: 72 };

test("builds a schedule from unit replacement value and quantity", () => {
  const report = buildInsuranceReport(inventory, [], [], [], new Date("2026-07-21T12:00:00Z"));
  assert.equal(report.totals.scheduledReplacementValue, 1500);
  assert.equal(report.totals.knownQuantity, 27);
  assert.equal(report.coverage.valuation, 50);
  assert.equal(report.exceptions.missingValuation, 1);
  assert.equal(report.coverage.cubanVerification, 100);
});

test("surfaces monitored value when a humidor has no readings", () => {
  const report = buildInsuranceReport(inventory, [humidor], [], [], new Date("2026-07-21T12:00:00Z"));
  assert.equal(report.climate[0].severity, "Offline");
  assert.equal(report.totals.valueAtClimateRisk, 1500);
});

test("zero-quantity historical lots stay out of the active insurance schedule", () => {
  const report = buildInsuranceReport([...inventory, { inventoryId: "OLD", brand: "Legacy", line: "Duplicate", vitola: "Churchill", currentQty: 0, retailValue: 500 }], [], [], []);
  assert.equal(report.rows.some(row => row.inventoryId === "OLD"), false);
  assert.equal(report.totals.lots, 2);
  assert.equal(report.totals.scheduledReplacementValue, 1500);
});

test("collection presentation assets stay outside cigar quantity and value totals", () => {
  const presentation:InventoryItem={inventoryId:"CASE",brand:"Maker",line:"Numbered Humidor",vitola:"Presentation asset",currentQty:1,retailValue:12975};
  const report=buildInsuranceReport(
    [...inventory,presentation],
    [],
    [],
    [],
    new Date("2026-07-21T12:00:00Z"),
    [{collectionId:"COL-1",name:"Numbered Humidor",presentationInventoryId:"CASE"}],
  );
  assert.equal(report.rows.some(row=>row.inventoryId==="CASE"),false);
  assert.equal(report.totals.knownQuantity,27);
  assert.equal(report.totals.scheduledReplacementValue,1500);
});
