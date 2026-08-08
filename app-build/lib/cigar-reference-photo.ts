import { canonicalCigarIdentity } from "./cigar-identity";
import type { CatalogCigar, InventoryItem } from "./types";

export type CigarReferencePhoto = {
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  catalogId: string;
};

function safeHttps(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function documentedPhoto(cigar?: CatalogCigar): CigarReferencePhoto | undefined {
  if (!cigar) return undefined;
  const imageUrl = safeHttps(cigar.referenceImageUrl);
  const sourceUrl = safeHttps(cigar.referenceImageSourceUrl);
  const sourceName = cigar.referenceImageSourceName?.trim();
  return imageUrl && sourceUrl && sourceName
    ? { imageUrl, sourceUrl, sourceName, catalogId: cigar.catalogId }
    : undefined;
}

/** Return only a fully attributed, exact release identity match. */
export function cigarReferencePhoto(item: InventoryItem, catalog: CatalogCigar[]) {
  const identityKey = canonicalCigarIdentity(item).identityKey;
  const candidates = catalog.filter(candidate =>
    canonicalCigarIdentity({ ...candidate, vintage: candidate.releaseYear }).identityKey === identityKey
  );
  const catalogLinked = item.catalogId
    ? candidates.find(candidate => candidate.catalogId === item.catalogId)
    : undefined;
  return documentedPhoto(catalogLinked ?? candidates[0]);
}
