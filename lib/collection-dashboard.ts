import { matchCollectionRequirements } from "@/lib/collection-matching";
import { collectionTemplates } from "@/lib/collection-templates";
import type { CigarCollection, InventoryItem, Valuation } from "@/lib/types";

export type CollectionValuePoint = {
  date: string;
  value: number;
};

export type CollectionDashboardSummary = {
  componentValue: number;
  wholeValue: number;
  premium: number;
  ownedComponents: number;
  expectedComponents?: number;
  completionPercent: number;
  missingComponents: string[];
  valueHistory: CollectionValuePoint[];
};

const normalized = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function collectionTemplateFor(collection: CigarCollection) {
  const byId = collectionTemplates.find(
    (template) => template.templateId.replace("TPL-", "COL-") === collection.collectionId,
  );
  if (byId) return byId;
  const name = normalized(collection.name);
  return collectionTemplates.find((template) => normalized(template.name) === name);
}

export function summarizeCollection(
  collection: CigarCollection,
  inventory: InventoryItem[],
  valuations: Valuation[],
): CollectionDashboardSummary {
  const members = inventory.filter((item) => item.collectionId === collection.collectionId);
  const latestByItem = new Map<string, Valuation>();
  for (const valuation of [...valuations].sort((a, b) => a.valuationDate.localeCompare(b.valuationDate))) {
    latestByItem.set(valuation.inventoryId, valuation);
  }
  const componentValue = members.reduce((sum, item) => {
    const valuation = latestByItem.get(item.inventoryId);
    return sum + (valuation?.marketValue ?? item.retailValue ?? 0) * (item.currentQty ?? 0);
  }, 0);
  const template = collectionTemplateFor(collection);
  const rawMatches = template ? matchCollectionRequirements(template.requirements, members) : [];
  const assignedInventory = new Set<string>();
  const matches = rawMatches.map((match) => {
    if (!match.inventoryId || assignedInventory.has(match.inventoryId)) {
      return { ...match, inventoryId: undefined, label: undefined };
    }
    assignedInventory.add(match.inventoryId);
    return match;
  });
  const expectedComponents = collection.expectedComponents ?? template?.expectedComponents;
  const ownedComponents = template
    ? matches.filter((match) => Boolean(match.inventoryId)).length
    : members.length;
  const missingComponents = template
    ? matches.filter((match) => !match.inventoryId).map((match) => match.requirement)
    : [];
  const completionPercent = expectedComponents
    ? Math.min(100, Math.round((ownedComponents / expectedComponents) * 100))
    : members.length
      ? 100
      : 0;

  const datedValues = new Map<string, number>();
  const memberById = new Map(members.map((item) => [item.inventoryId, item]));
  for (const valuation of valuations) {
    const item = memberById.get(valuation.inventoryId);
    if (!item) continue;
    const unitValue = valuation.marketValue ?? valuation.replacementValue;
    if (unitValue === undefined) continue;
    datedValues.set(
      valuation.valuationDate,
      (datedValues.get(valuation.valuationDate) ?? 0) + unitValue * (item.currentQty ?? 0),
    );
  }
  const valueHistory = [...datedValues]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
  const wholeValue = collection.wholeMarketValue ?? componentValue;
  return {
    componentValue,
    wholeValue,
    premium: wholeValue - componentValue,
    ownedComponents,
    expectedComponents,
    completionPercent,
    missingComponents,
    valueHistory,
  };
}
