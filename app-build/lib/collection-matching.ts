import type { InventoryItem } from "./types";

const ignored = new Set(["cigar", "cigars", "collection", "edition", "selection", "years", "year", "aged", "one", "the", "and", "with", "original"]);
const tokens = (value: string) => new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length > 1 && !ignored.has(token) && !/^\d+$/.test(token)));

export type RequirementMatch = { requirement: string; inventoryId?: string; label?: string; score: number };

export function matchCollectionRequirements(requirements: string[], inventory: InventoryItem[]): RequirementMatch[] {
  const candidates = requirements.map((requirement, index) => {
    const expected = tokens(requirement);
    const ranked = inventory.map((item) => {
      const owned = tokens(`${item.brand} ${item.line} ${item.vitola} ${item.vintage || ""}`);
      const overlap = [...expected].filter((token) => owned.has(token)).length;
      const score = expected.size ? overlap / expected.size : 0;
      return { item, score };
    }).sort((a, b) => b.score - a.score);
    return { requirement, index, ranked };
  });
  const assigned = new Set<string>();
  const results: RequirementMatch[] = requirements.map((requirement) => ({ requirement, score: 0 }));
  const strongestFirst = [...candidates].sort((a, b) => (b.ranked[0]?.score || 0) - (a.ranked[0]?.score || 0));
  for (const candidate of strongestFirst) {
    const best = candidate.ranked.find(({ item, score }) => score >= 0.45 && !assigned.has(item.inventoryId));
    if (!best) {
      results[candidate.index] = { requirement: candidate.requirement, score: candidate.ranked[0]?.score || 0 };
      continue;
    }
    assigned.add(best.item.inventoryId);
    results[candidate.index] = { requirement: candidate.requirement, inventoryId: best.item.inventoryId, label: `${best.item.brand} ${best.item.line} ${best.item.vitola}`, score: best.score };
  }
  return results;
}
