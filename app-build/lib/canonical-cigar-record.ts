import { canonicalCigarIdentity } from "./cigar-identity";
import { manufacturingCoverageForBrand, manufacturingTruthRecords } from "./manufacturing-truth";
import type { CatalogCigar, InventoryItem } from "./types";

export type CanonicalFieldStatus = "Documented" | "Brand context" | "Research needed";

export type CanonicalRecordField = {
  key: string;
  label: string;
  value?: string;
  status: CanonicalFieldStatus;
  guidance?: string;
};

export type CanonicalEvidence = {
  sourceName: string;
  sourceUrl?: string;
  sourceType: NonNullable<CatalogCigar["sourceType"]> | "Unclassified";
  confidence: NonNullable<CatalogCigar["confidence"]>;
  checkedAt?: string;
  supports: string;
};

export type CanonicalCigarRecord = {
  recordVersion: "1.0";
  catalogId: string;
  identityId: string;
  brand: string;
  line: string;
  vitola: string;
  completion: number;
  status: "Verified foundation" | "Developing record" | "Research required";
  identity: CanonicalRecordField[];
  blend: CanonicalRecordField[];
  release: CanonicalRecordField[];
  manufacturing: {
    productFactory?: string;
    brandContext: string;
    status: string;
    href: string;
    caution: string;
  };
  evidence: CanonicalEvidence[];
  researchGaps: string[];
  correctionNotes?: string;
  ownedLots: InventoryItem[];
};

function text(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function field(key: string, label: string, value: unknown, guidance: string): CanonicalRecordField {
  const documented = text(value);
  return {
    key,
    label,
    value: documented,
    status: documented ? "Documented" : "Research needed",
    guidance: documented ? undefined : guidance,
  };
}

function inventoryMatchesCatalog(item: InventoryItem, catalog: CatalogCigar) {
  const inventoryIdentity = canonicalCigarIdentity(item);
  const catalogIdentity = canonicalCigarIdentity(catalog);
  return item.catalogId === catalog.catalogId || inventoryIdentity.productKey === catalogIdentity.productKey;
}

export function buildCanonicalCigarRecord(catalog: CatalogCigar, inventory: InventoryItem[] = []): CanonicalCigarRecord {
  const identity = canonicalCigarIdentity(catalog);
  const coverage = manufacturingCoverageForBrand(catalog.brand);
  const brandRecord = coverage.recordId ? manufacturingTruthRecords.find((record) => record.id === coverage.recordId) : undefined;
  const ownedLots = inventory.filter((item) => inventoryMatchesCatalog(item, catalog));

  const identityFields = [
    field("brand", "Brand", identity.brand, "Confirm the commercial brand name."),
    field("line", "Line or blend", identity.line, "Confirm the named product family."),
    field("vitola", "Vitola", identity.vitola, "Confirm the marketed size and physical dimensions."),
    field("dimensions", "Dimensions", catalog.dimensions, "Document length and ring gauge from a product-level source."),
    field("country", "Stated origin", catalog.country, "Document the country stated for this exact product."),
  ];

  const blendFields = [
    field("wrapper", "Wrapper", catalog.wrapper, "Identify leaf, seed, treatment, and origin when the source supports them."),
    field("wrapperOrigin", "Wrapper origin", catalog.wrapperOrigin, "Record the growing country or region without inferring flavor."),
    field("binder", "Binder", catalog.binder, "Document the binder leaf from a product-level source."),
    field("binderOrigin", "Binder origin", catalog.binderOrigin, "Record the binder’s stated country or region."),
    field("filler", "Filler", catalog.filler, "Document the filler composition without guessing undisclosed tobaccos."),
    field("fillerOrigins", "Filler origins", catalog.fillerOrigins, "Record every disclosed growing origin."),
    field("strength", "Stated strength", catalog.strength, "Keep manufacturer positioning separate from collector-perceived strength."),
  ];

  const releaseFields = [
    field("releaseYear", "Release year", catalog.releaseYear, "Attach the record to a documented launch or production period."),
    field("edition", "Edition", catalog.edition, "Record regular production, limited edition, regional edition, or other stated context."),
    field("msrp", "Original MSRP", catalog.msrp === undefined ? undefined : `$${catalog.msrp.toFixed(2)}`, "Record MSRP with its date and market."),
    field("packaging", "Packaging", catalog.packaging, "Document box count, presentation, and known packaging revisions."),
    field("bandHistory", "Band history", catalog.bandHistory, "Preserve band revisions with effective dates and images."),
    field("productionState", "Production state", catalog.discontinued === undefined ? undefined : catalog.discontinued ? "Discontinued" : "Current production", "Confirm current or discontinued status with a dated source."),
  ];

  const exactFactory = text(catalog.factory);
  const documented = [...identityFields, ...blendFields, ...releaseFields].filter((item) => item.status === "Documented").length;
  const total = identityFields.length + blendFields.length + releaseFields.length + 2;
  const evidencePoints = (exactFactory ? 1 : 0) + (catalog.sourceUrl ? 1 : 0);
  const completion = Math.round(((documented + evidencePoints) / total) * 100);
  const researchGaps = [
    ...[...identityFields, ...blendFields, ...releaseFields].filter((item) => item.status === "Research needed").map((item) => item.label),
    ...(!exactFactory ? ["Exact product factory"] : []),
    ...(!catalog.sourceUrl ? ["Attributable product-level source"] : []),
  ];

  const evidence: CanonicalEvidence[] = [];
  if (catalog.sourceUrl) evidence.push({
    sourceName: catalog.sourceName || "Catalog product source",
    sourceUrl: catalog.sourceUrl,
    sourceType: catalog.sourceType || "Unclassified",
    confidence: catalog.confidence || "Unrated",
    checkedAt: catalog.verifiedAt,
    supports: "The product-level fields retained in this catalog record.",
  });
  if (brandRecord) evidence.push({
    sourceName: brandRecord.sourceName,
    sourceUrl: brandRecord.sourceUrl,
    sourceType: brandRecord.trustLevel,
    confidence: brandRecord.confidence,
    checkedAt: brandRecord.checkedAt,
    supports: "Brand ownership, creative authorship, factory system, and historical manufacturing context—not automatic proof for this exact release.",
  });

  return {
    recordVersion: "1.0",
    catalogId: catalog.catalogId,
    identityId: identity.identityId,
    brand: identity.brand,
    line: identity.line,
    vitola: identity.vitola,
    completion,
    status: completion >= 75 && Boolean(catalog.sourceUrl) && Boolean(exactFactory)
      ? "Verified foundation"
      : completion >= 35
        ? "Developing record"
        : "Research required",
    identity: identityFields,
    blend: blendFields,
    release: releaseFields,
    manufacturing: {
      productFactory: exactFactory,
      brandContext: brandRecord
        ? `${brandRecord.brand}: ${brandRecord.factories.join(" · ")}`
        : coverage.manufacturing,
      status: exactFactory ? "Product-level factory documented" : coverage.status,
      href: coverage.href,
      caution: exactFactory
        ? "This factory belongs to the catalog product record. Production periods and later revisions still require dated evidence."
        : "Brand-level manufacturing context is not automatically assigned to this cigar. Cedriva requires evidence for the exact line, vitola, release, and period.",
    },
    evidence,
    researchGaps,
    correctionNotes: text(catalog.correctionNotes),
    ownedLots,
  };
}

export function canonicalCatalogHref(catalogId: string) {
  return `/catalog/${encodeURIComponent(catalogId)}`;
}
