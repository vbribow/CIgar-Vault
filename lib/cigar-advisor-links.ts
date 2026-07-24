import type { InventoryItem } from "./types";

export type CigarAdvisorIntent = "complete" | "aging" | "pairing" | "value" | "collection";

const questions: Record<CigarAdvisorIntent, (item: InventoryItem) => string> = {
  complete: item => `Give me a complete, source-aware assessment of this ${item.brand} ${item.line} ${item.vitola}. Explain what is known, what is uncertain, how it fits my collection, and the most useful next action.`,
  aging: item => `Should I smoke this ${item.brand} ${item.line} ${item.vitola}${item.vintage ? ` from ${item.vintage}` : ""} now or continue aging it? Separate exact evidence from general aging guidance and explain the uncertainty.`,
  pairing: item => `Create a personalized pairing plan for this ${item.brand} ${item.line} ${item.vitola}. Include coffee and nonalcoholic choices, plus spirits and cocktails where appropriate, and explain why each pairing fits.`,
  value: item => `Help me understand the documented retail replacement value and latest completed-sale evidence for this ${item.brand} ${item.line} ${item.vitola}. Do not invent a price or confuse listings with completed sales.`,
  collection: item => `How does this ${item.brand} ${item.line} ${item.vitola} fit my broader collection${item.collectionId ? " and its linked collection" : ""}? Consider duplication, smoking history, wishlist priorities, stewardship, and the next best action.`,
};

export function cigarAdvisorHref(item: InventoryItem, intent: CigarAdvisorIntent = "complete") {
  const params = new URLSearchParams({ inventoryId: item.inventoryId, question: questions[intent](item) });
  return `/cigar-somm?${params.toString()}`;
}

export function cigarAdvisorActions(item: InventoryItem) {
  return [
    { intent: "aging" as const, label: "Smoke or age", detail: "Readiness and uncertainty", href: cigarAdvisorHref(item, "aging") },
    { intent: "pairing" as const, label: "Build a pairing", detail: "Coffee, spirits, cocktails, and zero-proof", href: cigarAdvisorHref(item, "pairing") },
    { intent: "value" as const, label: "Understand value", detail: "Retail and completed-sale evidence", href: cigarAdvisorHref(item, "value") },
    { intent: "collection" as const, label: "Collection fit", detail: "Stewardship and next action", href: cigarAdvisorHref(item, "collection") },
  ];
}
