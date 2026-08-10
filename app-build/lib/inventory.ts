import seed from "@/data/inventory.json";
import { InventoryItem } from "./types";
import { dataMode } from "./config";
import { normalizeInventory } from "./inventory-model";
import { loadPreviewInventoryOverrides } from "./preview-inventory";
import { loadAccountRecordRows } from "./user-data";

export async function loadInventory(): Promise<InventoryItem[]> {
  // A signed-in collector's private vault is always authoritative. Checking
  // mock mode first made successful Supabase writes appear to disappear on
  // refresh whenever USE_MOCK_DATA was accidentally left enabled.
  const accountInventory = await loadAccountRecordRows<InventoryItem>("inventory");
  if (accountInventory !== undefined) return accountInventory.map(row => ({ ...normalizeInventory(row.payload), addedAt: row.createdAt }));
  if (dataMode() === "mock") {
    const overrides = await loadPreviewInventoryOverrides();
    const seededIds=new Set((seed as InventoryItem[]).map(item=>item.inventoryId));
    return [
      ...(seed as InventoryItem[]).map(item=>normalizeInventory(overrides[item.inventoryId]??item)),
      ...Object.values(overrides).filter(item=>!seededIds.has(item.inventoryId)).map(normalizeInventory),
    ];
  }
  // The founder Smartsheet is an explicit migration/operations source, never
  // an anonymous production fallback for a collector's private Vault.
  return [];
}
