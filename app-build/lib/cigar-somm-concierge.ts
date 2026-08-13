import type { InventoryItem, SmokingLog } from "./types";

export type ConciergeCandidate = {
  item: InventoryItem;
  experienceCount: number;
  averageScore?: number;
  strength?: string;
  flavor?: string;
  buyAgainRate?: number;
  estimatedMinutes: number;
  durationBasis: string;
};

function mode(values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values.map((entry) => entry?.trim()).filter(Boolean) as string[]) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}
export function estimatedSmokingTime(vitola: string): { minutes: number; basis: string } {
  const value = vitola.toLowerCase();
  if (/cigarillo|mini|petit corona|short story|work of art/.test(value)) return { minutes: 30, basis: "vitola-based planning estimate" };
  if (/robusto|rothschild|corona|perfecxion no\. ?4/.test(value)) return { minutes: 50, basis: "vitola-based planning estimate" };
  if (/toro|belicoso|torpedo|double robusto|fuente fuente/.test(value)) return { minutes: 70, basis: "vitola-based planning estimate" };
  if (/churchill|double corona|presidente|lancero|perfecxion a/.test(value)) return { minutes: 105, basis: "vitola-based planning estimate" };
  return { minutes: 75, basis: "general planning estimate; exact duration is not documented" };
}

export function buildConciergeCandidates(inventory: InventoryItem[], smokes: SmokingLog[]): ConciergeCandidate[] {
  return inventory.filter((item) => (item.currentQty ?? 0) > 0).map((item) => {
    const experiences = smokes.filter((smoke) => smoke.inventoryId === item.inventoryId);
    const scores = experiences.map((smoke) => smoke.overall).filter((score): score is number => typeof score === "number");
    const buyAgain = experiences.map((smoke) => smoke.buyAgain).filter((value): value is boolean => typeof value === "boolean");
    const duration = estimatedSmokingTime(item.vitola);
    return {
      item,
      experienceCount: experiences.length,
      averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : item.score,
      strength: mode(experiences.map((smoke) => smoke.strength)),
      flavor: mode(experiences.map((smoke) => smoke.flavor)),
      buyAgainRate: buyAgain.length ? buyAgain.filter(Boolean).length / buyAgain.length : undefined,
      estimatedMinutes: duration.minutes,
      durationBasis: duration.basis,
    };
  });
}

function evidenceScore(candidate: ConciergeCandidate) {
  return (candidate.averageScore ?? 0) + Math.min(candidate.experienceCount, 4) * 0.25 + (candidate.buyAgainRate ?? 0) - (candidate.item.collectionId && (candidate.item.currentQty ?? 0) <= 1 ? 4 : 0);
}

export function recommendForTime(candidates: ConciergeCandidate[], minutes: number, limit = 3) {
  return [...candidates].filter((candidate) => candidate.estimatedMinutes <= minutes + 15).sort((a, b) => evidenceScore(b) - evidenceScore(a) || a.estimatedMinutes - b.estimatedMinutes).slice(0, limit);
}

export function recommendGuestFlight(candidates: ConciergeCandidate[], guests: number, limit = 4) {
  const safe = candidates.filter((candidate) => !candidate.item.collectionId && (candidate.item.currentQty ?? 0) >= Math.max(1, guests));
  const pool = safe.length ? safe : candidates.filter((candidate) => !candidate.item.collectionId);
  return [...pool].sort((a, b) => evidenceScore(b) - evidenceScore(a) || a.estimatedMinutes - b.estimatedMinutes).slice(0, limit);
}
