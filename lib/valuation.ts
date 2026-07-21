import type { InventoryItem } from "./types";

export function lotRetailValue(item: Pick<InventoryItem, "retailValue" | "currentQty">) {
  if (item.retailValue === undefined || item.currentQty === undefined) return undefined;
  return item.retailValue * item.currentQty;
}
