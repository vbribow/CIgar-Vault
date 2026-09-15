import type { InventoryItem, SmokingLog } from "./types";

export type CollectionExplorerFilters = { strength: string; experience: string; vitola: string; minimumRating: string; buyAgain: "all" | "yes" | "no" };
const normalized = (value?: string | number) => String(value ?? "").trim().toLocaleLowerCase();

export function inventorySmokeEvidence(item: InventoryItem, smokes: SmokingLog[]) {
  return smokes.filter(smoke => !smoke.outsideInventory && smoke.inventoryId === item.inventoryId);
}

export function matchesCollectionExplorer(item: InventoryItem, smokes: SmokingLog[], filters: CollectionExplorerFilters) {
  const evidence = inventorySmokeEvidence(item, smokes);
  if (filters.vitola !== "all" && normalized(item.vitola) !== normalized(filters.vitola)) return false;
  if (filters.strength !== "all" && !evidence.some(smoke => normalized(smoke.strength) === normalized(filters.strength))) return false;
  if (filters.experience.trim()) {
    const words = normalized(filters.experience).split(/\s+/).filter(Boolean);
    const searchable = evidence.map(smoke => [smoke.flavor, smoke.tastingNotes].filter(Boolean).join(" ")).join(" ").toLocaleLowerCase();
    if (!words.every(word => searchable.includes(word))) return false;
  }
  if (filters.minimumRating !== "all" && !evidence.some(smoke => typeof smoke.overall === "number" && smoke.overall >= Number(filters.minimumRating))) return false;
  if (filters.buyAgain !== "all" && !evidence.some(smoke => smoke.buyAgain === (filters.buyAgain === "yes"))) return false;
  return true;
}
