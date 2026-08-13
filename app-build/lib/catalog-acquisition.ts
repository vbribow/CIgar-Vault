import type { CatalogCigar } from "./types";
import type { CatalogDiscoveryResult } from "./catalog-discovery";
import { canonicalCigarIdentity } from "./cigar-identity";

export type CatalogAcquisitionLane = {
  id: "heritage-official" | "boutique-official" | "trade-releases" | "origin-watch";
  label: string;
  instructions: string;
};

export const catalogAcquisitionLanes: CatalogAcquisitionLane[] = [
  { id: "heritage-official", label: "Heritage brands and official archives", instructions: "Prioritize official manufacturer, importer, and established brand archive pages for heritage brands. Look for newly documented vitolas, release-year corrections, and missing blend or packaging facts." },
  { id: "boutique-official", label: "Boutique and emerging brands", instructions: "Prioritize official boutique-brand pages, verified brand announcements, and attributable maker interviews. Include small and newly formed brands without lowering exact-identity standards." },
  { id: "trade-releases", label: "Trade reporting and press releases", instructions: "Prioritize PCA and TPE releases, manufacturer press releases, and established cigar-trade reporting. Use articles as attributed evidence, summarize in original language, and never copy editorial prose." },
  { id: "origin-watch", label: "Growing regions and production context", instructions: "Review credible reporting from Nicaragua, the Dominican Republic, Honduras, Cuba, Ecuador, Mexico, Brazil, Cameroon, and the United States. Add product facts only when reporting supports an exact cigar; geopolitical or agricultural context alone must remain context and must never become a blend claim." },
];

export function catalogAcquisitionLane(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / (7 * 24 * 60 * 60 * 1000));
  return catalogAcquisitionLanes[week % catalogAcquisitionLanes.length]!;
}

const evidenceFields = ["country", "factory", "brandOwner", "blender", "wrapper", "wrapperOrigin", "binder", "binderOrigin", "filler", "fillerOrigins", "dimensions", "strength", "packaging", "releaseYear", "edition"] as const;
const identityKey = (item: Pick<CatalogCigar, "brand" | "line" | "vitola" | "releaseYear">) => canonicalCigarIdentity({ ...item, vintage: item.releaseYear }).identityKey;
const normalized = (value: unknown) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export type CatalogEvidenceCandidate = {
  discovery: CatalogDiscoveryResult["discoveries"][number];
  status: "new-identity" | "evidence-enrichment" | "conflict-review";
  changedFields: string[];
};

export function catalogEvidenceCandidates(discoveries: CatalogDiscoveryResult["discoveries"], existing: CatalogCigar[]): CatalogEvidenceCandidate[] {
  const known = new Map(existing.map((item) => [identityKey(item), item]));
  const candidates: CatalogEvidenceCandidate[] = [];
  for (const discovery of discoveries) {
    const current = known.get(identityKey(discovery));
    if (!current) { candidates.push({ discovery, status: "new-identity", changedFields: evidenceFields.filter((field) => Boolean(discovery[field]?.trim())) }); continue; }
    const supported = evidenceFields.filter((field) => Boolean(discovery[field]?.trim()) && discovery[field] !== "Unresolved");
    const changedFields = supported.filter((field) => normalized(current[field]) !== normalized(discovery[field]));
    if (!changedFields.length) continue;
    const conflicts = changedFields.some((field) => Boolean(normalized(current[field])));
    candidates.push({ discovery, status: conflicts ? "conflict-review" : "evidence-enrichment", changedFields });
  }
  return candidates;
}

export function catalogEvidenceFingerprint(candidate: CatalogEvidenceCandidate) {
  const text = [identityKey(candidate.discovery), candidate.discovery.sourceUrl, ...candidate.changedFields.map((field) => `${field}:${normalized(candidate.discovery[field as keyof typeof candidate.discovery])}`)].join("|");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `cef-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
