import { dataMode } from "./config";
import { canonicalCigarIdentity, cigarProductKey } from "./cigar-identity";
import { getCatalog } from "./smartsheet";
import type { CatalogCigar, InventoryItem } from "./types";

export function mergeCatalogRecords(master: CatalogCigar[], inventory: InventoryItem[]): CatalogCigar[] {
  const combined: unknown[] = [
    ...master,
    ...inventory.map((item) => ({ catalogId: item.catalogId || canonicalCigarIdentity(item).identityId, brand: item.brand, line: item.line, vitola: item.vitola })),
  ];
  const seen = new Set<string>();
  return combined.filter((value): value is CatalogCigar => {
    if (!value || typeof value !== "object") return false;
    const item = value as Partial<CatalogCigar>;
    if (typeof item.brand !== "string" || typeof item.line !== "string" || typeof item.vitola !== "string") return false;
    if (!item.brand.trim() || !item.line.trim() || !item.vitola.trim()) return false;
    const key = cigarProductKey({ brand: item.brand, line: item.line, vitola: item.vitola });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadCatalog(inventory: InventoryItem[]): Promise<CatalogCigar[]> {
  const master = dataMode() !== "mock" ? await getCatalog() : [];
  return mergeCatalogRecords(master, inventory);
}
