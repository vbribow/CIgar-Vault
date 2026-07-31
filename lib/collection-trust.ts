import { collectionEditionIssue, collectionTemplateFor, summarizeCollection } from "./collection-dashboard";
import { auditCollectionTemplateProtocol } from "./collection-templates";
import type { CigarCollection, InventoryItem, Valuation } from "./types";

export type CollectionTrustCheck = {
  id: "edition" | "contents" | "inventory" | "retail" | "aftermarket" | "photography";
  label: string;
  status: "Verified" | "Attention" | "Researching";
  detail: string;
  href?: string;
};

export function collectionPhotoEvidence(
  collection: CigarCollection,
  template = collectionTemplateFor(collection),
) {
  if (collection.photoLink) {
    return {
      photo: collection.photoLink,
      sourceUrl: collection.valuationSourceUrl,
      sourceLabel: collection.valuationSource,
    };
  }
  if (template?.templateId === "TPL-FUENTE-PURPLE-DREAM") {
    return {
      photo: template.imageUrl,
      sourceUrl: "https://www.fuenteagedselection.com/humidors/2026-purple-rain-big-purple-dream-humidor",
      sourceLabel: "Fuente Aged Selection official release photography",
    };
  }
  return {
    photo: template?.imageUrl,
    sourceUrl: template?.imageSourceUrl,
    sourceLabel: template?.imageSourceLabel,
  };
}

export function collectionTrustAudit(
  collection: CigarCollection,
  inventory: InventoryItem[],
  valuations: Valuation[],
) {
  const template = collectionTemplateFor(collection);
  const summary = summarizeCollection(collection, inventory, valuations);
  const editionIssue = collectionEditionIssue(collection);
  const expected = summary.expectedComponents ?? 0;
  const protocol=template?auditCollectionTemplateProtocol(template):undefined;
  const exactContents = Boolean(protocol?.readyForInventoryAutomation);
  const photoEvidence = collectionPhotoEvidence(collection, template);
  const photo = photoEvidence.photo;
  const photoSource = photoEvidence.sourceUrl;
  const checks: CollectionTrustCheck[] = [
    {
      id: "edition",
      label: "Collection edition",
      status: !template || editionIssue ? "Attention" : "Verified",
      detail: !template
        ? "No researched edition is connected."
        : editionIssue || `${template.releaseYear} release is separated from individual cigar production years.`,
      href: "/collections#collection-editor",
    },
    {
      id: "contents",
      label: "Published contents",
      status: exactContents ? "Verified" : "Researching",
      detail: exactContents
        ? `${expected} exact component identities are backed by the cited collection source.`
        : protocol?.issues.join(" ") || "The set is known, but one or more exact component identities still need evidence.",
      href: template?.sourceUrl,
    },
    {
      id: "inventory",
      label: "Vault linkage",
      status: expected > 0 && summary.ownedComponents === expected ? "Verified" : "Attention",
      detail: expected
        ? `${summary.ownedComponents} of ${expected} components are represented as linked individual inventory lots.`
        : "Expected components must be researched before completeness can be measured.",
    },
    {
      id: "retail",
      label: "Retail value",
      status: expected > 0 && summary.retailCoverage === expected ? "Verified" : "Attention",
      detail: `${summary.retailCoverage} of ${expected || summary.ownedComponents} components have exact-identity retail evidence.`,
      href: `/valuations?collectionId=${encodeURIComponent(collection.collectionId)}`,
    },
    {
      id: "aftermarket",
      label: summary.marketStandardLabel === "verified-sale standard" ? "Completed sales" : "Market standard",
      status: expected > 0 && summary.marketStandardCoverage === expected ? "Verified" : "Researching",
      detail: summary.marketStandardLabel === "verified-sale standard"
        ? `${summary.marketStandardCoverage} of ${expected || summary.ownedComponents} Habanos components have a dated, source-linked completed sale.`
        : `${summary.marketStandardCoverage} of ${expected || summary.ownedComponents} components meet the ${summary.marketStandardLabel}. New World retail consensus requires multiple exact listings and is never called a sale.`,
      href: `/valuations?collectionId=${encodeURIComponent(collection.collectionId)}`,
    },
    {
      id: "photography",
      label: "Collection photography",
      status: photo && photoSource ? "Verified" : photo ? "Attention" : "Researching",
      detail: photo && photoSource
        ? "Release photography is displayed with its source."
        : photo
          ? "A photograph is present, but its source still needs documentation."
          : "No source-linked collection photograph is available yet.",
      href: photoSource,
    },
  ];
  const required = checks.filter(check => check.id !== "aftermarket");
  return {
    checks,
    score: Math.round(required.filter(check => check.status === "Verified").length / required.length * 100),
    ready: required.every(check => check.status === "Verified"),
  };
}
