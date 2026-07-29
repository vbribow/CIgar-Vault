import type { InventoryItem } from "./types";
import { normalizeIdentityPart } from "./cigar-identity";

export type DuplicateCandidate = { item: InventoryItem; score: number; reasons: string[] };

export function findInventoryDuplicates(draft: Pick<InventoryItem, "brand" | "line" | "vitola" | "vintage">, inventory: InventoryItem[]): DuplicateCandidate[] {
  const brand = normalizeIdentityPart(draft.brand), line = normalizeIdentityPart(draft.line), vitola = normalizeIdentityPart(draft.vitola), vintage = normalizeIdentityPart(draft.vintage);
  if (!brand) return [];
  return inventory.flatMap((item) => {
    const reasons: string[] = [];
    let score = 0;
    if (normalizeIdentityPart(item.brand) === brand) { score += 45; reasons.push("same brand"); } else return [];
    if (line && normalizeIdentityPart(item.line) === line) { score += 25; reasons.push("same line"); }
    if (vitola && normalizeIdentityPart(item.vitola) === vitola) { score += 25; reasons.push("same vitola"); }
    if (vintage && normalizeIdentityPart(item.vintage) === vintage) { score += 5; reasons.push("same year"); }
    return score >= 65 ? [{ item, score, reasons }] : [];
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

export function photoDraftId(now = Date.now()) {
  return `INV-PHOTO-${now.toString(36).toUpperCase()}`;
}
