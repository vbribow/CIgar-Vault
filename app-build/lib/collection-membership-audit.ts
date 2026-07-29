import { cigarIdentityKey } from "./cigar-identity";
import {
  collectionEditionIssue,
  collectionRequirementMatches,
  collectionTemplateFor,
} from "./collection-dashboard";
import type { CigarCollection, InventoryItem } from "./types";

export type CollectionMembershipClassification =
  | "Standalone"
  | "Collection component"
  | "Both"
  | "Review";

export type CollectionMembershipIssue =
  | "Missing collection record"
  | "Unverified collection assignment"
  | "Collection release year missing"
  | "Collection edition mismatch"
  | "Cigar release is later than collection"
  | "Possible inherited collection year";

export type CollectionMembershipAuditRow = {
  inventoryId: string;
  identity: string;
  classification: CollectionMembershipClassification;
  collectionId?: string;
  collectionName?: string;
  issues: CollectionMembershipIssue[];
};

export type CollectionMembershipAudit = {
  rows: CollectionMembershipAuditRow[];
  counts: Record<CollectionMembershipClassification, number>;
  collectionIssues: Array<{
    collectionId: string;
    collectionName: string;
    issue: "Release year missing" | "Edition mismatch";
    detail: string;
  }>;
  ready: boolean;
};

function possibleInheritedYear(
  item: InventoryItem,
  collection: CigarCollection,
) {
  if (item.vintage === undefined || collection.releaseYear === undefined) return false;
  if (Number(item.vintage) !== Number(collection.releaseYear)) return false;
  return Boolean(
    item.notes?.includes("Expected component:") ||
      item.provenanceNotes?.includes("Collection component documented by"),
  );
}

/**
 * Classifies owned lots from documented relationships only. A collection-like
 * product name is never enough to create a relationship.
 *
 * "Both" means the same canonical cigar identity is represented by at least
 * one verified collection-linked lot and at least one standalone lot. It does
 * not merge their quantities or provenance.
 */
export function auditCollectionMembership(
  inventory: InventoryItem[],
  collections: CigarCollection[],
): CollectionMembershipAudit {
  const collectionById = new Map(
    collections.map((collection) => [collection.collectionId, collection]),
  );
  const verifiedLinkedIds = new Set<string>();

  for (const collection of collections) {
    const linked = inventory.filter(
      (item) => item.collectionId === collection.collectionId,
    );
    const template = collectionTemplateFor(collection);
    if (!template) {
      linked.forEach((item) => verifiedLinkedIds.add(item.inventoryId));
      continue;
    }
    for (const match of collectionRequirementMatches(collection, linked)) {
      if (match.inventoryId) verifiedLinkedIds.add(match.inventoryId);
    }
  }

  const standaloneIdentities = new Set(
    inventory
      .filter((item) => !item.collectionId)
      .map((item) => cigarIdentityKey(item)),
  );
  const verifiedCollectionIdentities = new Set(
    inventory
      .filter((item) => verifiedLinkedIds.has(item.inventoryId))
      .map((item) => cigarIdentityKey(item)),
  );

  const rows = inventory.map((item): CollectionMembershipAuditRow => {
    const identity = cigarIdentityKey(item);
    const collection = item.collectionId
      ? collectionById.get(item.collectionId)
      : undefined;
    const issues: CollectionMembershipIssue[] = [];

    if (item.collectionId && !collection) issues.push("Missing collection record");
    if (collection && !verifiedLinkedIds.has(item.inventoryId)) {
      issues.push("Unverified collection assignment");
    }
    if (collection && !collection.releaseYear) {
      issues.push("Collection release year missing");
    }
    if (collection && collectionEditionIssue(collection)) {
      issues.push("Collection edition mismatch");
    }
    if (
      collection?.releaseYear !== undefined &&
      item.vintage !== undefined &&
      Number(item.vintage) > Number(collection.releaseYear)
    ) {
      issues.push("Cigar release is later than collection");
    }
    if (collection && possibleInheritedYear(item, collection)) {
      issues.push("Possible inherited collection year");
    }

    const isVerifiedComponent = verifiedLinkedIds.has(item.inventoryId);
    const existsStandalone = standaloneIdentities.has(identity);
    const existsInCollection = verifiedCollectionIdentities.has(identity);
    const classification: CollectionMembershipClassification = issues.length
      ? "Review"
      : isVerifiedComponent && existsStandalone
        ? "Both"
        : isVerifiedComponent
          ? "Collection component"
          : !item.collectionId && existsInCollection
            ? "Both"
            : "Standalone";

    return {
      inventoryId: item.inventoryId,
      identity,
      classification,
      collectionId: item.collectionId,
      collectionName: collection?.name,
      issues,
    };
  });

  const counts: Record<CollectionMembershipClassification, number> = {
    Standalone: 0,
    "Collection component": 0,
    Both: 0,
    Review: 0,
  };
  rows.forEach((row) => {
    counts[row.classification] += 1;
  });

  const collectionIssues = collections.flatMap((collection) => {
    const problems: CollectionMembershipAudit["collectionIssues"] = [];
    if (!collection.releaseYear) {
      problems.push({
        collectionId: collection.collectionId,
        collectionName: collection.name,
        issue: "Release year missing",
        detail: "Confirm the collection edition year; do not copy it to its cigars.",
      });
    }
    const editionIssue = collectionEditionIssue(collection);
    if (editionIssue) {
      problems.push({
        collectionId: collection.collectionId,
        collectionName: collection.name,
        issue: "Edition mismatch",
        detail: editionIssue,
      });
    }
    return problems;
  });

  return {
    rows,
    counts,
    collectionIssues,
    ready:
      rows.every((row) => row.classification !== "Review") &&
      collectionIssues.length === 0,
  };
}
