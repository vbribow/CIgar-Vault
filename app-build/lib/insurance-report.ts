import { climateHealth } from "./climate-alerts";
import { cubanVerificationStatus, isCubanInventory } from "./cuban-verification";
import type { EnvironmentalSensor, Humidor, HumidorReading, InventoryItem } from "./types";

const percent = (complete: number, total: number) => total ? Math.round(complete / total * 100) : 100;

export type InsuranceScheduleRow = {
  inventoryId: string;
  cigar: string;
  vintage: string;
  packaging: string;
  quantity?: number;
  unitReplacement?: number;
  scheduledValue?: number;
  storage: string;
  photo: boolean;
  provenance: boolean;
  verification: string;
};

export function buildInsuranceReport(inventory: InventoryItem[], humidors: Humidor[], readings: HumidorReading[], sensors: EnvironmentalSensor[], now = new Date()) {
  const rows: InsuranceScheduleRow[] = inventory.map(item => ({
    inventoryId: item.inventoryId,
    cigar: [item.brand, item.line, item.vitola].filter(Boolean).join(" · "),
    vintage: item.vintage === undefined ? "Not recorded" : String(item.vintage),
    packaging: item.packaging || "Not recorded",
    quantity: item.currentQty,
    unitReplacement: item.retailValue,
    scheduledValue: item.currentQty === undefined || item.retailValue === undefined ? undefined : item.currentQty * item.retailValue,
    storage: item.storageLocationId || "Unassigned",
    photo: Boolean(item.photoLink || item.boxPhotoLink),
    provenance: Boolean(item.provenanceDocumentLink || item.provenanceNotes),
    verification: isCubanInventory(item) ? cubanVerificationStatus(item) : "Not applicable",
  })).sort((a, b) => (b.scheduledValue ?? -1) - (a.scheduledValue ?? -1));

  const cubanLots = inventory.filter(isCubanInventory);
  const boxedCubanLots = cubanLots.filter(item => cubanVerificationStatus(item) !== "Loose sticks");
  const climate = humidors.map(humidor => climateHealth(humidor, readings, sensors, inventory, now));
  const knownQuantity = inventory.reduce((sum, item) => sum + (item.currentQty ?? 0), 0);
  const scheduledReplacementValue = rows.reduce((sum, row) => sum + (row.scheduledValue ?? 0), 0);

  return {
    generatedAt: now.toISOString(),
    rows,
    totals: {
      lots: inventory.length,
      knownQuantity,
      scheduledReplacementValue,
      storageLocations: new Set(inventory.map(item => item.storageLocationId).filter(Boolean)).size,
      unassignedValue: rows.filter(row => row.storage === "Unassigned").reduce((sum, row) => sum + (row.scheduledValue ?? 0), 0),
      valueAtClimateRisk: climate.reduce((sum, item) => sum + item.valueAtRisk + item.unmonitoredValue, 0),
    },
    coverage: {
      quantity: percent(inventory.filter(item => item.currentQty !== undefined).length, inventory.length),
      valuation: percent(inventory.filter(item => item.retailValue !== undefined).length, inventory.length),
      photo: percent(rows.filter(row => row.photo).length, rows.length),
      provenance: percent(rows.filter(row => row.provenance).length, rows.length),
      cubanVerification: percent(boxedCubanLots.filter(item => cubanVerificationStatus(item) === "Verified").length, boxedCubanLots.length),
      boxedCubanLots: boxedCubanLots.length,
    },
    climate: climate.map(item => ({
      humidorId: item.humidor.humidorId,
      name: item.humidor.name,
      location: item.humidor.location || "Location not recorded",
      severity: item.severity,
      temperatureF: item.latest?.temperatureF,
      humidity: item.latest?.humidity,
      recordedAt: item.latest?.recordedAt,
      storedValue: item.storedValue,
      evidence: item.latest ? `${item.rows.length} climate readings` : "No climate readings",
    })),
    exceptions: {
      missingQuantity: inventory.filter(item => item.currentQty === undefined).length,
      missingValuation: inventory.filter(item => item.retailValue === undefined).length,
      missingPhoto: rows.filter(row => !row.photo).length,
      missingProvenance: rows.filter(row => !row.provenance).length,
      unassignedStorage: inventory.filter(item => !item.storageLocationId).length,
      cubanEvidenceNeeded: boxedCubanLots.filter(item => cubanVerificationStatus(item) !== "Verified").length,
    },
  };
}
