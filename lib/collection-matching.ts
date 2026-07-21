import type { InventoryItem } from "./types";

const ignored = new Set(["cigar", "cigars", "collection", "edition", "selection", "years", "year", "aged", "one", "the", "and", "with", "original"]);
const tokens = (value: string) => new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length > 1 && !ignored.has(token) && !/^\d+$/.test(token)));

export type RequirementMatch = { requirement: string; inventoryId?: string; label?: string; score: number };

export function matchCollectionRequirements(requirements: string[], inventory: InventoryItem[]): RequirementMatch[] {
  return requirements.map((requirement) => {
    const expected = tokens(requirement);
    const candidates = inventory.map((item) => {
      const owned = tokens(`${item.brand} ${item.line} ${item.vitola} ${item.vintage || ""}`);
      const overlap = [...expected].filter((token) => owned.has(token)).length;
      const score = expected.size ? overlap / expected.size : 0;
      return { item, score };
    }).sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best || best.score < 0.45) return { requirement, score: best?.score || 0 };
    return { requirement, inventoryId: best.item.inventoryId, label: `${best.item.brand} ${best.item.line} ${best.item.vitola}`, score: best.score };
  });
}
