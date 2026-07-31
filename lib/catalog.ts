import { dataMode } from "./config";
import { canonicalCigarIdentity, cigarProductKey } from "./cigar-identity";
import { getCatalog } from "./smartsheet";
import type { CatalogCigar, InventoryItem } from "./types";

export function mergeCatalogRecords(master: CatalogCigar[], inventory: InventoryItem[]): CatalogCigar[] {
  const combined = [
    ...master,
    ...inventory.map((item) => ({ catalogId: item.catalogId || canonicalCigarIdentity(item).identityId, brand: item.brand, line: item.line, vitola: item.vitola })),
  ];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = cigarProductKey(item);
    if (!item.brand.trim() || !item.line.trim() || !item.vitola.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadCatalog(inventory: InventoryItem[]): Promise<CatalogCigar[]> {
  const master = dataMode() !== "mock" ? await getCatalog() : [];
  return mergeCatalogRecords(master, inventory);
}
