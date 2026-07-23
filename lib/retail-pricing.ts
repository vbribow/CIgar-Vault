import { valuationIdentityKey } from "./valuation-monitor";
import type { InventoryItem, Valuation } from "./types";

export type ManualRetailPriceInput = {
  basis: "Per cigar" | "Full box";
  price: number;
  sticksPerBox?: number;
};

export type KnownRetailPriceSuggestion = {
  item: InventoryItem;
  valuation: Valuation;
  unitPrice: number;
  boxPrice?: number;
};

export function retailBoxValue(item: Pick<InventoryItem, "retailValue" | "sticksPerBox">) {
  if (item.retailValue === undefined || item.sticksPerBox === undefined) return undefined;
  return item.retailValue * item.sticksPerBox;
}

export function normalizeManualRetailPrice(input: ManualRetailPriceInput) {
  if (!Number.isFinite(input.price) || input.price < 0) throw new Error("Enter a valid retail price.");
  if (input.basis === "Per cigar") {
    return {
      unitPrice: input.price,
      boxPrice: input.sticksPerBox ? input.price * input.sticksPerBox : undefined,
    };
  }
  if (!Number.isInteger(input.sticksPerBox) || (input.sticksPerBox ?? 0) <= 0) {
    throw new Error("Enter the number of cigars in the box.");
  }
  return {
    unitPrice: input.price / input.sticksPerBox!,
    boxPrice: input.price,
  };
}

export function knownRetailPriceSuggestions(inventory: InventoryItem[], valuations: Valuation[]): KnownRetailPriceSuggestion[] {
  const inventoryById = new Map(inventory.map(item => [item.inventoryId, item]));
  const evidence = valuations
    .filter(valuation => valuation.replacementValue !== undefined && Boolean(valuation.sourceUrl) && /^(High|Medium)$/i.test(valuation.confidence ?? ""))
    .flatMap(valuation => {
      const item = inventoryById.get(valuation.inventoryId);
      return item ? [{ item, valuation }] : [];
    })
    .sort((a, b) => b.valuation.valuationDate.localeCompare(a.valuation.valuationDate));

  return inventory.flatMap(item => {
    if (item.retailValue !== undefined) return [];
    const match = evidence.find(candidate => valuationIdentityKey(candidate.item) === valuationIdentityKey(item));
    if (!match || match.valuation.replacementValue === undefined) return [];
    return [{
      item,
      valuation: match.valuation,
      unitPrice: match.valuation.replacementValue,
      boxPrice: item.sticksPerBox === undefined ? undefined : match.valuation.replacementValue * item.sticksPerBox,
    }];
  });
}
