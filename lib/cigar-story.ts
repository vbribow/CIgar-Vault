import { canonicalCigarIdentity, cigarIdentityKey } from "./cigar-identity";
import type { CigarCollection, InventoryItem, ProfessionalRating, SmokingLog, Valuation } from "./types";

export function cigarStoryId(item: Pick<InventoryItem, "brand" | "line" | "vitola" | "vintage">) {
  return canonicalCigarIdentity(item).identityId;
}

export function cigarStoryHref(item: Pick<InventoryItem, "brand" | "line" | "vitola" | "vintage">) {
  return `/cigars/${encodeURIComponent(cigarStoryId(item))}`;
}

export function buildCigarStory(input: {
  identityId: string;
  inventory: InventoryItem[];
  valuations: Valuation[];
  smokes: SmokingLog[];
  ratings: ProfessionalRating[];
  collections: CigarCollection[];
}) {
  const anchor = input.inventory.find(item => cigarStoryId(item) === input.identityId);
  if (!anchor) return undefined;
  const identity = canonicalCigarIdentity(anchor);
  const lots = input.inventory.filter(item => cigarIdentityKey(item) === identity.identityKey);
  const lotIds = new Set(lots.map(item => item.inventoryId));
  const valuations = input.valuations.filter(item => lotIds.has(item.inventoryId)).sort((a, b) => b.valuationDate.localeCompare(a.valuationDate));
  const smokes = input.smokes.filter(item => lotIds.has(item.inventoryId)).sort((a, b) => b.dateSmoked.localeCompare(a.dateSmoked));
  const ratings = input.ratings.filter(item => lotIds.has(item.inventoryId)).sort((a, b) => b.score - a.score);
  const collectionIds = new Set(lots.flatMap(item => item.collectionId ? [item.collectionId] : []));
  const collections = input.collections.filter(item => collectionIds.has(item.collectionId));
  const latestValuation = valuations[0];
  const completedSale = valuations
    .filter(item => item.lastSaleValue !== undefined && item.lastSaleDate && item.lastSaleSourceUrl)
    .sort((a, b) => (b.lastSaleDate || "").localeCompare(a.lastSaleDate || ""))[0];
  const retailUnits = lots.flatMap(item => item.retailValue === undefined ? [] : [item.retailValue]);
  const retailUnit = retailUnits.length ? Math.max(...retailUnits) : latestValuation?.replacementValue;
  const quantity = lots.reduce((sum, item) => sum + (item.currentQty ?? 0), 0);
  const personalScores = smokes.flatMap(item => item.overall === undefined ? [] : [item.overall]);
  const publishedScores = ratings.map(item => item.score);
  const sources = new Set([
    ...valuations.flatMap(item => item.sourceUrl ? [item.sourceUrl] : []),
    ...ratings.map(item => item.sourceUrl),
    ...lots.flatMap(item => item.boxFormatSourceUrl ? [item.boxFormatSourceUrl] : []),
  ]);
  return {
    identity,
    lots,
    valuations,
    smokes,
    ratings,
    collections,
    latestValuation,
    completedSale,
    retailUnit,
    quantity,
    retailLotValue: retailUnit === undefined ? undefined : retailUnit * quantity,
    marketUnit: latestValuation?.marketValue,
    personalAverage: personalScores.length ? Math.round(personalScores.reduce((sum, value) => sum + value, 0) / personalScores.length * 10) / 10 : undefined,
    publishedAverage: publishedScores.length ? Math.round(publishedScores.reduce((sum, value) => sum + value, 0) / publishedScores.length * 10) / 10 : undefined,
    sourceCount: sources.size,
    confidence: identity.complete && sources.size >= 2 ? "High" : identity.complete && sources.size ? "Medium" : "Developing",
  };
}
