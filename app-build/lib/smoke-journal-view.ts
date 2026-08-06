import type { InventoryItem, SmokingLog } from "@/lib/types";

export type SmokeJournalSource = "all" | "vault" | "review";

export type SmokeJournalEntry = {
  smoke: SmokingLog;
  item?: InventoryItem;
  title: string;
  detail: string;
  source: Exclude<SmokeJournalSource, "all">;
};

export function buildSmokeJournalEntries(smokes: SmokingLog[], inventory: InventoryItem[]): SmokeJournalEntry[] {
  const lots = new Map(inventory.map(item => [item.inventoryId, item]));
  return smokes.map(smoke => {
    const item = lots.get(smoke.inventoryId);
    return {
      smoke,
      item,
      title: smoke.cigarName || (item ? `${item.brand} ${item.line}` : smoke.inventoryId),
      detail: item ? [item.vitola, item.vintage].filter(Boolean).join(" · ") : "Review-only journal entry",
      source: item ? "vault" as const : "review" as const,
    };
  }).sort((left, right) => right.smoke.dateSmoked.localeCompare(left.smoke.dateSmoked) || right.smoke.smokeId.localeCompare(left.smoke.smokeId));
}

export function filterSmokeJournalEntries(entries: SmokeJournalEntry[], query: string, source: SmokeJournalSource) {
  const normalized = query.trim().toLocaleLowerCase();
  return entries.filter(entry => {
    if (source !== "all" && entry.source !== source) return false;
    if (!normalized) return true;
    const searchable = [
      entry.title,
      entry.detail,
      entry.smoke.inventoryId,
      entry.smoke.dateSmoked,
      entry.smoke.flavor,
      entry.smoke.strength,
      entry.smoke.construction,
      entry.smoke.burn,
      entry.smoke.tastingNotes,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return searchable.includes(normalized);
  });
}
