import { matchCollectionRequirements } from "@/lib/collection-matching";
import { collectionTemplates } from "@/lib/collection-templates";
import { collectionComponentMarketEvidence } from "@/lib/collection-market-evidence";
import type { CigarCollection, InventoryItem, Valuation } from "@/lib/types";

export type CollectionValuePoint = {
  date: string;
  value: number;
};

export type CollectionDashboardSummary = {
  componentValue: number;
  cigarRetailValue: number;
  wholeValue: number;
  premium: number;
  isHumidorCollection: boolean;
  humidorValue?: number;
  humidorValueStatus: "Not applicable" | "Calculated" | "Awaiting complete cigar retail values" | "Whole-set retail needed";
  ownedComponents: number;
  expectedComponents?: number;
  expectedCigars?: number;
  expectedContents: string[];
  completionPercent: number;
  missingComponents: string[];
  valueHistory: CollectionValuePoint[];
  valueEvidence: "Collection record" | "Researched template" | "Component inventory" | "Pending";
  valueAsOf?: string;
  retailCoverage: number;
  marketCoverage: number;
  completedSaleCoverage: number;
  excludedAssignedLots: string[];
  editionIssue?: string;
};

const normalized = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function collectionTemplateFor(collection: CigarCollection) {
  const byId = collectionTemplates.find(
    (template) => template.templateId.replace("TPL-", "COL-") === collection.collectionId,
  );
  if (byId) return byId;
  const name = normalized(collection.name);
  return collectionTemplates.find((template) => {
    const names = [template.name, ...(template.aliases ?? [])].map(normalized);
    return names.some(candidate => candidate === name || (candidate.length >= 8 && name.includes(candidate)));
  });
}

export function collectionMatchMinimum(template: (typeof collectionTemplates)[number]) {
  return ["TPL-FUENTE-PADRON-LEGENDS","TPL-PADRON-COLLECTION"].includes(template.templateId) ? 0.45 : 0.72;
}

export function collectionEditionIssue(collection:CigarCollection){
  const template=collectionTemplateFor(collection);
  if(!template?.releaseYear)return undefined;
  if(!collection.releaseYear)return`Confirm the ${template.releaseYear} release year before using this edition template.`;
  return collection.releaseYear===template.releaseYear?undefined:`Saved release year ${collection.releaseYear} does not match the researched ${template.releaseYear} edition.`;
}

export function collectionRequirementMatches(collection: CigarCollection, members: InventoryItem[]) {
  const template = collectionTemplateFor(collection);
  const rawMatches = template ? matchCollectionRequirements(template.requirements, members,collectionMatchMinimum(template)) : [];
  const assignedInventory = new Set<string>();
  return rawMatches.map((match) => {
    if (!match.inventoryId || assignedInventory.has(match.inventoryId)) {
      return { ...match, inventoryId: undefined, label: undefined };
    }
    assignedInventory.add(match.inventoryId);
    return match;
  });
}

export function summarizeCollection(
  collection: CigarCollection,
  inventory: InventoryItem[],
  valuations: Valuation[],
): CollectionDashboardSummary {
  const assignedMembers = inventory.filter((item) => item.collectionId === collection.collectionId);
  const template = collectionTemplateFor(collection);
  const editionIssue=collectionEditionIssue(collection);
  const matches = collectionRequirementMatches(collection, assignedMembers);
  const verifiedIds = new Set(matches.flatMap(match=>match.inventoryId?[match.inventoryId]:[]));
  const members = template ? assignedMembers.filter(item=>verifiedIds.has(item.inventoryId)) : assignedMembers;
  const excludedAssignedLots = template ? assignedMembers.filter(item=>!verifiedIds.has(item.inventoryId)).map(item=>item.inventoryId) : [];
  const componentValue = members.reduce((sum, item) => {
    const evidence = collectionComponentMarketEvidence(item, inventory, valuations);
    return sum + (evidence.valueUnit ?? 0) * (item.currentQty ?? 0);
  }, 0);
  const componentEvidence = members.map(item => collectionComponentMarketEvidence(item, inventory, valuations));
  const isHumidorCollection = /\bhumidor\b/i.test(`${collection.name} ${collection.edition ?? ""} ${template?.packaging ?? ""}`);
  const cigarRetailValue = members.reduce((sum, item, index) => {
    const originalCount = item.originalQty ?? item.currentQty ?? 0;
    return sum + (componentEvidence[index].retailUnit ?? 0) * originalCount;
  }, 0);
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
  const wholeValue = collection.wholeMarketValue ?? template?.documentedWholeValue ?? componentValue;
  const valueEvidence = collection.wholeMarketValue !== undefined
    ? "Collection record"
    : template?.documentedWholeValue !== undefined
      ? "Researched template"
      : componentValue > 0
        ? "Component inventory"
        : "Pending";
  const expectedCigars = collection.expectedCigars ?? template?.expectedCigars;
  const originalCigars = members.reduce((sum,item)=>sum+(item.originalQty??item.currentQty??0),0);
  const hasCompleteCigarRetail = members.length > 0
    && componentEvidence.every(evidence => evidence.retailUnit !== undefined)
    && (expectedCigars === undefined || originalCigars >= expectedCigars);
  const humidorValue = isHumidorCollection && valueEvidence !== "Pending" && hasCompleteCigarRetail
    ? Math.max(0, wholeValue - cigarRetailValue)
    : undefined;
  const humidorValueStatus = !isHumidorCollection
    ? "Not applicable"
    : valueEvidence === "Pending"
      ? "Whole-set retail needed"
      : hasCompleteCigarRetail
        ? "Calculated"
        : "Awaiting complete cigar retail values";
  return {
    componentValue,
    cigarRetailValue,
    wholeValue,
    premium: wholeValue - componentValue,
    isHumidorCollection,
    humidorValue,
    humidorValueStatus,
    ownedComponents,
    expectedComponents,
    expectedCigars,
    expectedContents: template?.requirements ?? [],
    completionPercent,
    missingComponents,
    valueHistory,
    valueEvidence,
    valueAsOf: collection.valuationDate ?? template?.valueAsOf,
    retailCoverage: componentEvidence.filter(evidence => evidence.retailUnit !== undefined).length,
    marketCoverage: componentEvidence.filter(evidence => evidence.marketUnit !== undefined).length,
    completedSaleCoverage: componentEvidence.filter(evidence => evidence.completedSale !== undefined).length,
    excludedAssignedLots,
    editionIssue,
  };
}
