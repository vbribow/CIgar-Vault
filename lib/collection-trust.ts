import { collectionEditionIssue, collectionTemplateFor, summarizeCollection } from "./collection-dashboard";
import type { CigarCollection, InventoryItem, Valuation } from "./types";

export type CollectionTrustCheck = {
  id: "edition" | "contents" | "inventory" | "retail" | "aftermarket" | "photography";
  label: string;
  status: "Verified" | "Attention" | "Researching";
  detail: string;
  href?: string;
};

export function collectionTrustAudit(
  collection: CigarCollection,
  inventory: InventoryItem[],
  valuations: Valuation[],
) {
  const template = collectionTemplateFor(collection);
  const summary = summarizeCollection(collection, inventory, valuations);
  const editionIssue = collectionEditionIssue(collection);
  const expected = summary.expectedComponents ?? 0;
  const exactContents = Boolean(template && template.researchStatus === "Verified");
  const photo = collection.photoLink || template?.imageUrl;
  const photoSource = collection.photoLink ? collection.valuationSourceUrl : template?.imageSourceUrl;
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
        : "The set is known, but one or more exact component identities still need evidence.",
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
      label: "Completed sales",
      status: expected > 0 && summary.completedSaleCoverage === expected ? "Verified" : "Researching",
      detail: `${summary.completedSaleCoverage} of ${expected || summary.ownedComponents} components have a dated, source-linked completed sale. Asking prices do not count.`,
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
