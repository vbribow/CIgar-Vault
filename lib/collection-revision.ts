import type { CigarCollection, InventoryItem } from "./types";
import { recordRevision } from "./record-revision";

/**
 * Protects both the collection facts and the membership snapshot without
 * exposing either in the request header.
 */
export function collectionRevision(
  collection: CigarCollection,
  inventory: InventoryItem[],
): string {
  const memberIds = inventory
    .filter(item => item.collectionId === collection.collectionId)
    .map(item => item.inventoryId)
    .sort();
  return recordRevision({ collection, memberIds });
}
