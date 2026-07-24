import type { CollectionTemplate } from "./collection-templates";
import type { CigarCollection, InventoryItem } from "./types";

export type CollectionProvenanceSummary = {
  collectionYear?: number;
  recordedComponentYears: number;
  unknownComponentYears: number;
  identityReview: number;
  yearPolicy: string;
};

export function summarizeCollectionProvenance(
  collection: CigarCollection,
  template: CollectionTemplate | undefined,
  members: InventoryItem[],
): CollectionProvenanceSummary {
  const recordedYear = collection.releaseYear ?? template?.releaseYear;
  return {
    collectionYear: recordedYear === undefined || !Number.isFinite(Number(recordedYear)) ? undefined : Number(recordedYear),
    recordedComponentYears: members.filter(item => item.vintage !== undefined).length,
    unknownComponentYears: members.filter(item => item.vintage === undefined).length,
    identityReview: members.filter(item => item.status === "Review" || /verify|unknown/i.test(item.vitola)).length,
    yearPolicy: "The collection edition year is never inherited as an individual cigar year. Component years are recorded only from cigar-specific evidence.",
  };
}
