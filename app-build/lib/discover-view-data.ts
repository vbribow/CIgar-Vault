import { cigarProductKey } from "./cigar-identity";
import type { CatalogCigar, InventoryItem } from "./types";

type ExactCigar = Pick<CatalogCigar, "brand" | "line" | "vitola">;

function isExactCigar(value: unknown): value is ExactCigar {
  if (!value || typeof value !== "object") return false;
  const cigar = value as Partial<ExactCigar>;
  return typeof cigar.brand === "string"
    && typeof cigar.line === "string"
    && typeof cigar.vitola === "string"
    && Boolean(cigar.brand.trim() && cigar.line.trim() && cigar.vitola.trim());
}

export function discoverViewData(inventoryInput: unknown, catalogInput: unknown) {
  const inventory = Array.isArray(inventoryInput)
    ? inventoryInput.filter(isExactCigar) as InventoryItem[]
    : [];
  const catalog = Array.isArray(catalogInput)
    ? catalogInput.filter(isExactCigar) as CatalogCigar[]
    : [];

  const ownedProducts = new Set(inventory.map(cigarProductKey));
  const ownedBrands = new Set(inventory.map(item => item.brand.trim().toLowerCase()));
  const seen = new Set<string>();
  const candidates = catalog
    .filter(item => !ownedProducts.has(cigarProductKey(item)))
    .sort((left, right) =>
      Number(ownedBrands.has(left.brand.toLowerCase())) - Number(ownedBrands.has(right.brand.toLowerCase()))
      || Number(Boolean(right.sourceUrl)) - Number(Boolean(left.sourceUrl))
      || left.brand.localeCompare(right.brand))
    .filter(item => {
      const identity = typeof item.catalogId === "string" && item.catalogId.trim()
        ? `catalog:${item.catalogId}`
        : `product:${cigarProductKey(item)}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });

  return { candidates, ownedBrands: [...ownedBrands] };
}
