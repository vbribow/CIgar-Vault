import { loadInventory } from "../lib/inventory";
import { buildOwnedCollectionReconciliation } from "../lib/owned-collection-reconciliation";
import { savePreviewCollection } from "../lib/preview-collections";
import { savePreviewInventoryOverrides } from "../lib/preview-inventory";

const inventory=await loadInventory();
const reconciliation=buildOwnedCollectionReconciliation(inventory);
for(const collection of reconciliation.collections)await savePreviewCollection(collection);
await savePreviewInventoryOverrides(reconciliation.inventory);
console.log(JSON.stringify({
  collections:reconciliation.collections.map(item=>item.collectionId),
  inventoryRecords:reconciliation.inventory.length,
},null,2));
