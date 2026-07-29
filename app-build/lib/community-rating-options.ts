import type { InventoryItem } from "./types";

export type CommunityRatingInventoryOption = {
  inventoryId: string;
  brand: string;
  line: string;
  vitola: string;
  vintage?: string;
};

export function communityRatingInventoryOptions(items: InventoryItem[]): CommunityRatingInventoryOption[] {
  const unique = new Map<string, CommunityRatingInventoryOption>();
  for (const item of items) {
    const option = {
      inventoryId: item.inventoryId,
      brand: item.brand.trim(),
      line: item.line.trim(),
      vitola: item.vitola.trim(),
      vintage: item.vintage === undefined ? undefined : String(item.vintage).trim() || undefined,
    };
    if (!option.brand || !option.line || !option.vitola || (item.currentQty ?? 0) <= 0) continue;
    const key = [option.brand, option.line, option.vitola, option.vintage ?? ""].map(value => value.toLowerCase()).join("|");
    if (!unique.has(key)) unique.set(key, option);
  }
  return [...unique.values()].sort((a, b) =>
    a.brand.localeCompare(b.brand) ||
    a.line.localeCompare(b.line) ||
    a.vitola.localeCompare(b.vitola) ||
    (a.vintage ?? "").localeCompare(b.vintage ?? ""),
  );
}
