import type { InventoryItem } from "./types";

function clean(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export type DuplicateCandidate = { item: InventoryItem; score: number; reasons: string[] };

export function findInventoryDuplicates(draft: Pick<InventoryItem, "brand" | "line" | "vitola" | "vintage">, inventory: InventoryItem[]): DuplicateCandidate[] {
  const brand = clean(draft.brand), line = clean(draft.line), vitola = clean(draft.vitola), vintage = clean(draft.vintage);
  if (!brand) return [];
  return inventory.flatMap((item) => {
    const reasons: string[] = [];
    let score = 0;
    if (clean(item.brand) === brand) { score += 45; reasons.push("same brand"); } else return [];
    if (line && clean(item.line) === line) { score += 25; reasons.push("same line"); }
    if (vitola && clean(item.vitola) === vitola) { score += 25; reasons.push("same vitola"); }
    if (vintage && clean(item.vintage) === vintage) { score += 5; reasons.push("same year"); }
    return score >= 65 ? [{ item, score, reasons }] : [];
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

export function photoDraftId(now = Date.now()) {
  return `INV-PHOTO-${now.toString(36).toUpperCase()}`;
}
