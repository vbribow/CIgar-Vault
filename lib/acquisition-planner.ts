import { collectionRequirementMatches, collectionTemplateFor, summarizeCollection } from "@/lib/collection-dashboard";
import type { CigarCollection, InventoryItem, Valuation } from "@/lib/types";

export type AcquisitionTarget = {
  collectionId: string;
  collectionName: string;
  maker?: string;
  releaseYear?: string | number;
  requirement: string;
  sourceUrl?: string;
  sourceLabel?: string;
  completionPercent: number;
  estimatedValueImpact: number;
  priority: "High" | "Medium" | "Standard";
};

export function buildAcquisitionPlan(collections: CigarCollection[], inventory: InventoryItem[], valuations: Valuation[]) {
  const targets: AcquisitionTarget[] = [];
  for (const collection of collections) {
    const template = collectionTemplateFor(collection);
    if (!template) continue;
    const members = inventory.filter((item) => item.collectionId === collection.collectionId);
    const matches = collectionRequirementMatches(collection, members);
    const missing = matches.filter((match) => !match.inventoryId);
    const summary = summarizeCollection(collection, inventory, valuations);
    const remainingPremium = Math.max(0, summary.wholeValue - summary.componentValue);
    const estimatedValueImpact = missing.length ? remainingPremium / missing.length : 0;
    for (const match of missing) {
      const priority = summary.completionPercent >= 75 || estimatedValueImpact >= 500 ? "High" : summary.completionPercent >= 40 || estimatedValueImpact >= 150 ? "Medium" : "Standard";
      targets.push({ collectionId: collection.collectionId, collectionName: collection.name, maker: collection.maker, releaseYear: collection.releaseYear, requirement: match.requirement, sourceUrl: template.sourceUrl, sourceLabel: template.sourceLabel, completionPercent: summary.completionPercent, estimatedValueImpact, priority });
    }
  }
  const priorityRank = { High: 3, Medium: 2, Standard: 1 };
  return targets.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || b.estimatedValueImpact - a.estimatedValueImpact || b.completionPercent - a.completionPercent);
}
