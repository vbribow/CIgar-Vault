import { canonicalBrand, cigarBrands } from "./brand-directory";
import type { InventoryItem } from "./types";

export type CigarMarketStandard = "Habanos" | "New World";

export function cigarMarketStandard(
  item: Pick<InventoryItem, "brand" | "habanosVerified">,
): CigarMarketStandard {
  if (item.habanosVerified) return "Habanos";
  const brand = canonicalBrand(item.brand);
  return cigarBrands.find(candidate => candidate.name === brand)?.segment === "Habanos"
    ? "Habanos"
    : "New World";
}

export function isHabanosInventoryItem(
  item: Pick<InventoryItem, "brand" | "habanosVerified">,
) {
  return cigarMarketStandard(item) === "Habanos";
}
