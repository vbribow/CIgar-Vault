import { dataMode } from "./config";
import { getCatalog } from "./smartsheet";
import type { CatalogCigar, InventoryItem } from "./types";

export async function loadCatalog(inventory: InventoryItem[]): Promise<CatalogCigar[]> {
  if (dataMode() !== "mock") return getCatalog();
  return inventory.map((item, index) => ({ catalogId: item.catalogId || `CAT-${index + 1}`, brand: item.brand, line: item.line, vitola: item.vitola }));
}
