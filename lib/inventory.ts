import seed from "@/data/inventory.json";
import { InventoryItem } from "./types";
import { dataMode } from "./config";
import { normalizeInventory } from "./inventory-model";
import { loadAccountRecords } from "./user-data";

export async function loadInventory(): Promise<InventoryItem[]> {
  // A signed-in collector's private vault is always authoritative. Checking
  // mock mode first made successful Supabase writes appear to disappear on
  // refresh whenever USE_MOCK_DATA was accidentally left enabled.
  const accountInventory = await loadAccountRecords<InventoryItem>("inventory");
  if (accountInventory !== undefined) return accountInventory.map(normalizeInventory);
  if (dataMode() === "mock") return (seed as InventoryItem[]).map(normalizeInventory);
  // The founder Smartsheet is an explicit migration/operations source, never
  // an anonymous production fallback for a collector's private Vault.
  return [];
}
