import { canonicalCigarIdentity, cigarIdentityKey } from "./cigar-identity";
import type { InventoryItem, SmokingLog } from "./types";

export const constructionOrdinal = ["Poor", "Fair", "Good", "Very good", "Excellent"] as const;
export const burnOrdinal = ["Major burn issue", "Relight required", "Multiple touch-ups", "Minor touch-up", "Even throughout"] as const;

type Distribution = { label: string; count: number };
type Trend = { label: "Improving" | "Declining" | "Stable" | "Mixed"; from: string; to: string; count: number };

export type SmokingExperienceScorecard = {
  scope: "lot" | "exact identity";
  exactIdentity: boolean;
  experienceCount: number;
  lotCount: number;
  overall: { average?: number; count: number };
  construction: { latest?: string; count: number; distribution: Distribution[]; trend?: Trend };
  burn: { latest?: string; count: number; distribution: Distribution[]; trend?: Trend };
  strength: { latest?: string; count: number; distribution: Distribution[] };
  flavors: Distribution[];
  buyAgain: { yes: number; count: number; rate?: number };
  history: SmokingLog[];
};

function distribution(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.map(value => value.trim()).filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// These arrays express ordinal direction only. Gaps are not treated as equal numeric intervals.
function trend(values: string[], order: readonly string[]): Trend | undefined {
  if (values.length < 2) return undefined;
  const ranked = values.map(value => order.indexOf(value)).filter(value => value >= 0);
  if (ranked.length < 2) return undefined;
  const movements = ranked.slice(1).map((value, index) => Math.sign(value - ranked[index]));
  const nonZero = movements.filter(Boolean);
  const label = !nonZero.length ? "Stable" : nonZero.every(value => value > 0) ? "Improving" : nonZero.every(value => value < 0) ? "Declining" : "Mixed";
  return { label, from: values[0], to: values[values.length - 1], count: ranked.length };
}

function build(smokes: SmokingLog[], scope: SmokingExperienceScorecard["scope"], lotCount: number, exactIdentity: boolean): SmokingExperienceScorecard {
  const chronological = [...smokes].sort((a, b) => a.dateSmoked.localeCompare(b.dateSmoked) || a.smokeId.localeCompare(b.smokeId));
  const newestFirst = [...chronological].reverse();
  const scores = chronological.flatMap(item => item.overall === undefined ? [] : [item.overall]);
  const construction = chronological.map(item => item.construction?.trim() || "").filter(Boolean);
  const burn = chronological.map(item => item.burn?.trim() || "").filter(Boolean);
  const strength = chronological.map(item => item.strength?.trim() || "").filter(Boolean);
  const flavors = chronological.flatMap(item => (item.flavor || "").split(/[,;|]/).map(value => value.trim()).filter(Boolean));
  const buyAgain = chronological.filter(item => item.buyAgain !== undefined);
  return {
    scope,
    exactIdentity,
    experienceCount: chronological.length,
    lotCount,
    overall: { average: scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length * 10) / 10 : undefined, count: scores.length },
    construction: { latest: newestFirst.find(item => item.construction)?.construction, count: construction.length, distribution: distribution(construction), trend: trend(construction, constructionOrdinal) },
    burn: { latest: newestFirst.find(item => item.burn)?.burn, count: burn.length, distribution: distribution(burn), trend: trend(burn, burnOrdinal) },
    strength: { latest: newestFirst.find(item => item.strength)?.strength, count: strength.length, distribution: distribution(strength) },
    flavors: distribution(flavors).slice(0, 5),
    buyAgain: { yes: buyAgain.filter(item => item.buyAgain).length, count: buyAgain.length, rate: buyAgain.length ? Math.round(buyAgain.filter(item => item.buyAgain).length / buyAgain.length * 100) : undefined },
    history: newestFirst,
  };
}

export function buildSmokingExperienceScorecards(item: InventoryItem, inventory: InventoryItem[], smokes: SmokingLog[]) {
  const lotSmokes = smokes.filter(smoke => smoke.inventoryId === item.inventoryId);
  const identity = canonicalCigarIdentity(item);
  const exactLots = identity.complete ? inventory.filter(value => canonicalCigarIdentity(value).complete && cigarIdentityKey(value) === identity.identityKey) : [item];
  const exactLotIds = new Set(exactLots.map(value => value.inventoryId));
  const exactSmokes = smokes.filter(smoke => exactLotIds.has(smoke.inventoryId));
  return {
    lot: build(lotSmokes, "lot", 1, identity.complete),
    identity: identity.complete ? build(exactSmokes, "exact identity", exactLots.length, true) : undefined,
  };
}

export function smokingScorecardSommContext(scorecard: SmokingExperienceScorecard) {
  return {
    privacy: "Private smoking-log evidence for this signed-in collector",
    scope: scorecard.scope,
    experiences: scorecard.experienceCount,
    lots: scorecard.lotCount,
    overall: scorecard.overall.count ? { average: scorecard.overall.average, ratedExperiences: scorecard.overall.count } : { status: "not yet rated" },
    construction: scorecard.construction.count ? { latest: scorecard.construction.latest, distribution: scorecard.construction.distribution, trend: scorecard.construction.trend } : { status: "not yet rated" },
    burn: scorecard.burn.count ? { latest: scorecard.burn.latest, distribution: scorecard.burn.distribution, trend: scorecard.burn.trend } : { status: "not yet rated" },
    strength: scorecard.strength.count ? { latest: scorecard.strength.latest, distribution: scorecard.strength.distribution } : { status: "not yet rated" },
    commonFlavorNotes: scorecard.flavors.length ? scorecard.flavors : "not yet rated",
    buyAgain: scorecard.buyAgain.count ? { yes: scorecard.buyAgain.yes, ratedExperiences: scorecard.buyAgain.count, ratePercent: scorecard.buyAgain.rate } : { status: "not yet rated" },
    uncertainty: scorecard.experienceCount < 2 ? scorecard.experienceCount === 1 ? "One experience; no trend is inferred." : "No smoking experiences recorded." : "Summary reflects the collector's recorded experiences only.",
  };
}
