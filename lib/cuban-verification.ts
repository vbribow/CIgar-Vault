import type { InventoryItem } from "./types";

export const cubanBrands = new Set(["Bolívar", "Cohiba", "Hoyo de Monterrey", "Juan López", "Partagás", "Ramon Allones", "Ramón Allones", "Saint Luis Rey", "Trinidad"]);

export function isCubanInventory(item: InventoryItem) { return cubanBrands.has(item.brand); }
export function isLooseCigar(item: InventoryItem) { return /individual|loose|single/i.test(item.packaging || ""); }
export function cubanVerificationStatus(item: InventoryItem) {
  if (isLooseCigar(item)) return "Loose sticks";
  if (item.habanosVerified && item.boxCode && item.habanosSealPhotoLink) return "Verified";
  if (item.boxCode && item.habanosSealPhotoLink) return "Ready to verify";
  if (item.boxCode || item.habanosSealPhotoLink) return "Partial evidence";
  return "Evidence needed";
}
