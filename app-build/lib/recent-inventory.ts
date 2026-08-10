import type { InventoryItem } from "./types";

export function recentlyAddedInventory(items: InventoryItem[], limit = 5): InventoryItem[] {
  return items
    .filter(item => item.addedAt && Number.isFinite(Date.parse(item.addedAt)))
    .sort((left, right) => Date.parse(right.addedAt!) - Date.parse(left.addedAt!))
    .slice(0, limit);
}
