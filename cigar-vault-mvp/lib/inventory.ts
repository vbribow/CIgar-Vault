import seed from "@/data/inventory.json";
import { getInventory } from "./smartsheet";
import { InventoryItem } from "./types";

export async function loadInventory(): Promise<InventoryItem[]> {
  if (process.env.USE_MOCK_DATA === "true" || !process.env.SMARTSHEET_ACCESS_TOKEN) return seed as InventoryItem[];
  return getInventory();
}
