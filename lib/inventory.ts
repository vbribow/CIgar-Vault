import seed from "@/data/inventory.json";
import { getInventory } from "./smartsheet";
import { InventoryItem } from "./types";
import { dataMode } from "./config";
import { normalizeInventory } from "./inventory-model";

export async function loadInventory(): Promise<InventoryItem[]> {
  if (dataMode() === "mock") return (seed as InventoryItem[]).map(normalizeInventory);
  return getInventory();
}
