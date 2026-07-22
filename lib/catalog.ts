import { dataMode } from "./config";
import { getCatalog } from "./smartsheet";
import type { CatalogCigar, InventoryItem } from "./types";

export async function loadCatalog(inventory: InventoryItem[]): Promise<CatalogCigar[]> {
  const master = dataMode() !== "mock" ? await getCatalog() : [];
  const combined = [
    ...master,
    ...inventory.map((item, index) => ({ catalogId: item.catalogId || `INV-CAT-${index + 1}`, brand: item.brand, line: item.line, vitola: item.vitola })),
  ];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = [item.brand, item.line, item.vitola].map((value) => value.trim().toLocaleLowerCase()).join("|");
    if (!item.brand.trim() || !item.line.trim() || !item.vitola.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
