import { canonicalCigarIdentity, normalizeIdentityPart } from "./cigar-identity";
import type { CatalogCigar, InventoryItem } from "./types";

export type InventoryOrigin = { status: "Documented" | "Research needed"; country?: string; catalog?: CatalogCigar; reason: string };

function documentedCountry(value: unknown) {
  const country = String(value ?? "").trim();
  return country && !/^(unknown|unresolved|pending|not documented|n\/a)$/i.test(country) ? country : undefined;
}
function compatibleRelease(item: InventoryItem, cigar: CatalogCigar) {
  const owned = normalizeIdentityPart(item.vintage), catalog = normalizeIdentityPart(cigar.releaseYear);
  return !owned || !catalog || owned === catalog;
}

/** Exact product evidence only. Brand, wrapper, and nearby-vitola context are never enough. */
export function inventoryOrigin(item: InventoryItem, catalog: CatalogCigar[]): InventoryOrigin {
  const identity = canonicalCigarIdentity(item);
  if (!identity.complete) return { status: "Research needed", reason: "Confirm the exact brand, line, and vitola first." };
  const exact = catalog.filter(candidate => {
    const candidateIdentity = canonicalCigarIdentity(candidate);
    return candidateIdentity.complete && candidateIdentity.productKey === identity.productKey && compatibleRelease(item, candidate);
  });
  const linked = exact.find(candidate => candidate.catalogId === item.catalogId);
  const candidates = linked ? [linked] : exact;
  const withCountry = candidates.filter(candidate => documentedCountry(candidate.country));
  const countries = [...new Set(withCountry.map(candidate => documentedCountry(candidate.country)!))];
  if (countries.length === 1) {
    const evidence = withCountry.find(candidate => Boolean(candidate.sourceUrl)) || withCountry[0];
    return { status: "Documented", country: countries[0], catalog: evidence, reason: evidence.sourceUrl ? "Exact cigar record with attributable product evidence." : "Exact cigar catalog record; source documentation should still be strengthened." };
  }
  if (countries.length > 1) return { status: "Research needed", reason: "Exact catalog records conflict on origin; review the release year and source evidence." };
  if (exact.length) return { status: "Research needed", catalog: exact[0], reason: "The exact cigar is connected, but its stated origin has not been documented." };
  return { status: "Research needed", reason: "No exact catalog record with a compatible release year is available yet." };
}

export function exactCatalogMatch(item: InventoryItem, catalog: CatalogCigar[]) {
  const identity = canonicalCigarIdentity(item);
  const matches = catalog.filter(candidate => canonicalCigarIdentity(candidate).productKey === identity.productKey && compatibleRelease(item, candidate));
  const linked = matches.find(candidate => candidate.catalogId === item.catalogId);
  if (linked) return linked;
  return matches.length === 1 ? matches[0] : undefined;
}
