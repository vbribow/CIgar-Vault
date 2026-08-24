import { inventoryOrigin } from "./inventory-origin";
import { hasInventoryProvenance, hasPhysicalQuantityBreakdown, inventoryCompleteness } from "./inventory-model";
import type { CatalogCigar, InventoryItem } from "./types";
import { isPhysicalVitola } from "./vitolas";

export type VaultReviewTask = {
  id: string;
  inventoryId: string;
  cigar: string;
  vitola: string;
  issue: "quantity" | "identity" | "collection" | "storage" | "provenance" | "photo" | "year" | "value" | "origin" | "rating";
  title: string;
  explanation: string;
  action: string;
  href: string;
  completeness: number;
  optional?: boolean;
  creditNotice?: string;
};

const returnToReview = "/collection-health#finish-my-vault";

function editHref(item: InventoryItem, focus: "quantity" | "year" | "storage" | "provenance" | "rating" | "all") {
  return `/inventory/${encodeURIComponent(item.inventoryId)}?focus=${focus}&searchReturn=${encodeURIComponent(returnToReview)}#inventory-editor`;
}

function task(item: InventoryItem, issue: VaultReviewTask["issue"], values: Omit<VaultReviewTask, "id" | "inventoryId" | "cigar" | "vitola" | "issue" | "completeness">): VaultReviewTask {
  return {
    id: `${item.inventoryId}:${issue}`,
    inventoryId: item.inventoryId,
    cigar: `${item.brand} ${item.line}`.trim(),
    vitola: item.vitola,
    issue,
    completeness: inventoryCompleteness(item),
    ...values,
  };
}

/** Returns one honest next step per physical lot. Unknown facts remain unknown until the collector acts. */
export function buildVaultReviewTasks(items: InventoryItem[], catalog: CatalogCigar[] | undefined, collectionIssues = new Map<string, string[]>()): VaultReviewTask[] {
  return items.flatMap(item => {
    if (!hasPhysicalQuantityBreakdown(item)) return [task(item, "quantity", {
      title: "Confirm how many cigars are physically here",
      explanation: "Enter the total on hand, or record full boxes, cigars per box, and loose sticks. Hojavía will not change the original quantity.",
      action: "Confirm quantity",
      href: editHref(item, "quantity"),
    })];
    if (!isPhysicalVitola(item.vitola)) return [task(item, "identity", {
      title: "Confirm the exact vitola or dimensions",
      explanation: "The saved name does not yet identify a physical cigar size or shape. Review the band, box, or measurements before correcting it.",
      action: "Review identity",
      href: editHref(item, "all"),
    })];
    const relationshipIssues = collectionIssues.get(item.inventoryId);
    if (relationshipIssues?.length) return [task(item, "collection", {
      title: "Review this collection relationship",
      explanation: relationshipIssues.join(" · "),
      action: "Open exact record",
      href: `/inventory/${encodeURIComponent(item.inventoryId)}?searchReturn=${encodeURIComponent(returnToReview)}#record-top`,
    })];
    if (!item.storageLocationId?.trim()) return [task(item, "storage", {
      title: "Choose where this cigar is stored",
      explanation: "Select one registered humidor or storage location. Nothing else on the record will change.",
      action: "Assign storage",
      href: editHref(item, "storage"),
    })];
    if (!hasInventoryProvenance(item)) return [task(item, "provenance", {
      title: "Add what you know about ownership",
      explanation: "Record the seller, receipt, prior owner, gift, or acquisition story. Leave uncertain details blank.",
      action: "Add ownership history",
      href: editHref(item, "provenance"),
    })];
    if (!item.photoLink && !item.boxPhotoLink && !item.boxCodePhotoLink && !item.provenanceDocumentLink) return [task(item, "photo", {
      title: "Add a useful record photo",
      explanation: "A band, cigar, box, code, or receipt photo makes future identification and provenance review easier.",
      action: "Add photos",
      href: `/inventory/${encodeURIComponent(item.inventoryId)}?searchReturn=${encodeURIComponent(returnToReview)}#record-photos`,
      optional: true,
    })];
    if (item.vintage === undefined || String(item.vintage).trim() === "") return [task(item, "year", {
      title: "Add the production or release year if known",
      explanation: "Use the exact cigar’s band, box, or dated evidence. Choose “Skip for now” when the year is not documented.",
      action: "Review year",
      href: editHref(item, "year"),
      optional: true,
    })];
    if (item.retailValue === undefined) return [task(item, "value", {
      title: "Review replacement value",
      explanation: "You may enter a known per-cigar retail price manually. Market research remains separate and never invents a value.",
      action: "Review value options",
      href: `/inventory/${encodeURIComponent(item.inventoryId)}?focus=price&searchReturn=${encodeURIComponent(returnToReview)}#inventory-editor`,
      optional: true,
      creditNotice: "Manual entry uses no credits. Starting new live research may use configured research credits and must be chosen separately.",
    })];
    const origin = catalog ? inventoryOrigin(item, catalog) : undefined;
    if (origin && origin.status !== "Documented") return [task(item, "origin", {
      title: "Research the exact cigar’s origin",
      explanation: origin.reason,
      action: "Search Hojavía first",
      href: `/discover?query=${encodeURIComponent(`${item.brand} ${item.line} ${item.vitola}${item.vintage ? ` ${item.vintage}` : ""}`)}`,
      optional: true,
      creditNotice: "Searching Hojavía’s existing records uses no research credits. A live-source search is separate and warns before it uses configured credits.",
    })];
    if (item.score === undefined) return [task(item, "rating", {
      title: "Add your personal rating when ready",
      explanation: "This is your private collection score. It is not a professional review or an inferred rating.",
      action: "Rate this cigar",
      href: editHref(item, "rating"),
      optional: true,
    })];
    return [];
  }).sort((a, b) => Number(Boolean(a.optional)) - Number(Boolean(b.optional)) || a.completeness - b.completeness || a.cigar.localeCompare(b.cigar));
}
