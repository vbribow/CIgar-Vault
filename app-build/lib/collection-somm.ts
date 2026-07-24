import type { CigarCollection, InventoryItem, SmokingLog } from "./types";

export type CollectionSommCandidate = {
  item: InventoryItem;
  rank: number;
  evidence: "Recent personal tasting" | "Recorded cigar score" | "General age guidance" | "Readiness unknown";
  detail: string;
};

const key = (value: string) => value.toLowerCase().replace(/^(inv|col)-/,"").replace(/-c\d+$/,"").replace(/[^a-z0-9]+/g,"");

export function inferSommCollectionId(selected: InventoryItem | undefined, collections: CigarCollection[]) {
  if (!selected) return "";
  if (selected.collectionId && collections.some(collection => collection.collectionId === selected.collectionId)) return selected.collectionId;
  const inventoryKey = key(selected.inventoryId);
  const idMatch = collections.find(collection => inventoryKey.includes(key(collection.collectionId)));
  if (idMatch) return idMatch.collectionId;
  const identityKey = key(`${selected.brand} ${selected.line}`);
  return collections.find(collection => {
    const nameKey = key(collection.name);
    return nameKey.length >= 7 && identityKey.includes(nameKey);
  })?.collectionId || "";
}

const validYear = (value: InventoryItem["vintage"]) => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1800 && year <= new Date().getUTCFullYear() ? year : undefined;
};

export function rankCollectionSommCandidates(items: InventoryItem[], smokes: SmokingLog[], now = new Date()): CollectionSommCandidate[] {
  return items.map(item => {
    const recent = smokes.filter(smoke => smoke.inventoryId === item.inventoryId && smoke.overall !== undefined).sort((a, b) => b.dateSmoked.localeCompare(a.dateSmoked))[0];
    if (recent) {
      const days = Math.max(0, (now.getTime() - new Date(`${recent.dateSmoked}T00:00:00Z`).getTime()) / 86_400_000);
      const freshness = Math.max(0, 365 - days) / 365;
      return { item, rank: 400 + (recent.overall ?? 0) + freshness * 20, evidence: "Recent personal tasting" as const, detail: `Your exact-cigar record: ${recent.overall}/100 on ${recent.dateSmoked}. Personal evidence is stronger than a generic maturity estimate.` };
    }
    if (item.score !== undefined) return { item, rank: 300 + item.score, evidence: "Recorded cigar score" as const, detail: `This exact inventory cigar carries a recorded score of ${item.score}/100; confirm when and how that score was established.` };
    const year = validYear(item.vintage);
    if (year) {
      const age = Math.max(0, now.getUTCFullYear() - year);
      const phase = age < 2 ? "still relatively young" : age < 7 ? "developing" : age <= 15 ? "within a broad mature-age window" : "at extended age";
      return { item, rank: 200 + Math.min(age, 15), evidence: "General age guidance" as const, detail: `${year} record is ${age} year${age === 1 ? "" : "s"} old and ${phase}. This is a general heuristic, not proof of current flavor or condition.` };
    }
    return { item, rank: 100, evidence: "Readiness unknown" as const, detail: "No exact tasting record or individual-cigar year is documented. Cedriva will not invent a smoke-now conclusion." };
  }).sort((a, b) => b.rank - a.rank || `${a.item.brand} ${a.item.line}`.localeCompare(`${b.item.brand} ${b.item.line}`));
}
