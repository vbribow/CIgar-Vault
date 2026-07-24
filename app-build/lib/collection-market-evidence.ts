import { cigarIdentityKey } from "./cigar-identity";
import type { InventoryItem, Valuation } from "./types";

export type CollectionComponentMarketEvidence = {
  retailUnit?: number;
  marketUnit?: number;
  valueUnit?: number;
  valuation?: Valuation;
  completedSale?: Valuation;
  reusedFromInventoryId?: string;
};

export function collectionComponentMarketEvidence(item: InventoryItem, inventory: InventoryItem[], valuations: Valuation[]): CollectionComponentMarketEvidence {
  const identity = cigarIdentityKey(item);
  const matchingIds = new Set(inventory.filter(candidate => cigarIdentityKey(candidate) === identity).map(candidate => candidate.inventoryId));
  const evidence = valuations
    .filter(valuation => matchingIds.has(valuation.inventoryId))
    .sort((a, b) => b.valuationDate.localeCompare(a.valuationDate));
  const own = evidence.find(valuation => valuation.inventoryId === item.inventoryId);
  const shared = evidence.find(valuation => Boolean(valuation.sourceUrl) && /^(High|Medium)$/i.test(valuation.confidence ?? ""));
  const valuation = own ?? shared;
  const completedSale = evidence.find(valuation => valuation.lastSaleValue !== undefined && Boolean(valuation.lastSaleDate) && Boolean(valuation.lastSaleSourceUrl));
  const retailUnit = item.retailValue ?? valuation?.replacementValue;
  const marketUnit = valuation?.marketValue;
  return {
    retailUnit,
    marketUnit,
    valueUnit: marketUnit ?? retailUnit,
    valuation,
    completedSale,
    reusedFromInventoryId: valuation && valuation.inventoryId !== item.inventoryId ? valuation.inventoryId : undefined,
  };
}
